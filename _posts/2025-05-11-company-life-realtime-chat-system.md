---
layout: post
title: "[25.04.16~25.05.02] 실시간 채팅 시스템 구축기"
date: 2025-05-11 22:13:14 +0900
categories: [회사생활]
tags: [회사생활, 실시간채팅, websocket, redis, 아키텍처]
permalink: /company-life/company-life-realtime-chat-system/
---

> 벨로그 시리즈 '회사생활'에서 옮긴 글입니다. 원문 흐름은 유지하고, GitHub 블로그 형식에 맞게 정리했습니다.

#  그냥 메시지 주고받으면 끝 아니야?

2025년 4월 우리 팀은 실시간 채팅 기능을 추가해야 했다.
개발 초기엔 “WebSocket으로 메시지만 주고받으면 되겠지”라고 가볍게 생각했다.

하지만 실제로는 달랐다.
클라이언트와 서버는 WebSocket으로 연결되지만, 서버는 여러 VM 인스턴스로 나눠져 있고, 사용자는 로드밸런서를 통해 어느 인스턴스에 연결될지 알 수 없는 구조였다.

여기에 인증, 세션, 메시지 브로드캐스트, 데이터 저장소 분리 등까지 고려해야 할 게 너무 많았다.


---

# 기술 스택 

- Spring Boot (WebSocket/STOMP)
- Kafka (메시지 브로커)
- Redis (세션 관리, 캐시)
- MongoDB (채팅 메시지 정보 저장)
- PostgreSQL (채팅방 정보 저장)
- VM 기반 다중 인스턴스 + 로드밸런서


![](https://velog.velcdn.com/images/whitewise95/post/afdb75a3-6821-497e-8f93-00e1ad788cb3/image.png)

---


<br>
<br>


# 개발기 

## 1. WebSocket + STOMP: 시작은 간단했다

Spring Boot는 WebSocket을 지원하고, STOMP를 쓰면 구독 기반 메시지 관리가 가능하다.
처음에는 아래처럼 간단하게 시작했다.

```java
@MessageMapping("/chat.send")
public void sendMessage(ChatMessage message) { ... }

@SubscribeMapping("/chat.room.{roomId}")
public void subscribeRoom(@DestinationVariable String roomId) { ... }
```

하지만 실제 운영환경에서는 WebSocket의 상태를 서버가 유지해야 하고,
클라이언트가 어떤 VM 인스턴스에 붙을지 예측이 안 되기 때문에 세션 공유와 메시지 브로드캐스트가 핵심 과제가 되었다.


<br>
<br>


## 2. WebSocket 세션 공유, 어떻게 할까?

> WebSocket은 상태 기반 연결이다. 즉, 서버가 세션을 메모리에 들고 있어야 한다.
그런데 서버가 여러 대(VM)라면? 한 인스턴스가 가진 세션 정보를 다른 인스턴스는 알 수 없다.


### ✅  WebSocket 연결/해제 이벤트 기반으로 Redis 세션 관리
Redis를 중심으로 세션 정보를 관리해서, 어떤 인스턴스에서든 동일한 사용자의 구독/참여 정보를 조회할 수 있게 했다.


```java 
	/**
	 * 웹소켓 연결 시 세션 레디스 저장
	 */
	@EventListener
	public void onConnect(SessionConnectEvent event) {
		Object simpSessionId = event.getMessage().getHeaders().get("simpSessionId");

		if (simpSessionId != null) {
			// 레디스 세션 저장 로직
			return;
		}

		// 세션ID가 없다면 에러 
		throw new RuntimeException("Forbidden");
	}
    
    
    /**
	 * 웹소켓 연결해제시 레디스 정리
	 */
	@EventListener
	public void onDisconnect(SessionDisconnectEvent event) {
		String sessionId = event.getSessionId();
		//레디스 세션 삭제 ...
	}
    
```

<br>
<br>


## 3. Kafka 파티션 기반으로 세션별 메시지 전송하기

> "Kafka에 저장된 메시지를 어떻게 정확히 해당 유저 세션(WebSocket)에 전송할 것인가?"

우리는 이를 위해 Kafka 파티션을 VM 단위로 고정 할당하고,
Redis를 통해 어떤 유저가 어떤 VM에 연결되어 있는지를 추적해,
메시지를 해당 파티션 → VM → WebSocket 세션으로 전송하도록 구성했다.


### ✅ Kafka 파티션 분산 처리 전략 - VM 환경변수 기반 컨슈머 설정

- 아래는 각 VM이 실행될 때 전달되는 환경변수

```bash
# VM1
-Dkafka.chat.consumer.id=chat-consumer-01
-Dkafka.chat.consumer.total-consumer-count=3

# VM2
-Dkafka.chat.consumer.id=chat-consumer-02
-Dkafka.chat.consumer.total-consumer-count=3

# VM3
-Dkafka.chat.consumer.id=chat-consumer-03
-Dkafka.chat.consumer.total-consumer-count=3
```

- 위 값은 Spring Boot의 application.yml 또는 환경변수로 주입된다.

```yml
kafka:
  chat:
    consumer:
      id: ${CONSUMER_ID}
      total-consumer-count: ${TOTAL_CONSUMER_COUNT}
```

```java
public class KafkaChatConsumerProperty {

	private String id;
	private Integer totalConsumerCount;

	public Integer getConsumerIndex() {
		String[] splitArr = this.id.split("-");
		return Integer.parseInt(splitArr[splitArr.length - 1]) - 1;
	}
}
```

- VM에서 실행 시 consumer.id를 주입받아 index 계산
- index는 0부터 시작하므로 consumer-01이면 0, consumer-02면 1…


### ✅ 파티션 분산 원리

- 컨슈머 토픽 할당하는 부분 로직
```java
public void startPartitionedListener() {
    
... 생략

TopicPartitionOffset[] offsets = IntStream.range(0, getPartitionCount(getTopicName(TOPIC))) // 토픽의 총 파티션 개수 조회
												  .filter(p -> p % kafkaChatConsumerProperty.getTotalConsumerCount() == CONSUMER_INDEX) // 담당할 파티션 필터링
												  .mapToObj(p ->  new TopicPartitionOffset(TOPIC, p))
												  .toArray(TopicPartitionOffset[]::new);


.... 생략

}
```


> `.filter(p -> p % totalConsumerCount == consumerIndex)`
>
> 예를 들어:
> - Kafka 토픽이 6개의 파티션을 가지고 있다면: [0, 1, 2, 3, 4, 5] 
- 총 컨슈머 수가 3이고, 현재 인스턴스의 index가 0이라면

```
0 % 3 == 0 → 담당
1 % 3 == 1 → skip
2 % 3 == 2 → skip
3 % 3 == 0 → 담당
4 % 3 == 1 → skip
5 % 3 == 2 → skip

→ consumer-01은 파티션 0, 3을 담당하게 된다.
이 방식으로 모든 인스턴스가 서로 겹치지 않고 정해진 파티션만 고정 처리하게 된다.
```



### ✅ 이 방식의 장점
- 각 VM이 명확하게 어떤 Kafka 파티션을 소비할지 제어 가능
- Redis로 accountId → consumerId를 저장해두면 Kafka 메시지가 정확히 해당 인스턴스의 컨슈머에게 전달
- 인스턴스를 늘리거나 줄일 경우, 환경변수만 조정해서 파티션 분배 재구성 가능
- 컨슈머 수만큼 VM을 수평 확장 가능 → 확장성과 예측 가능성 확보


<br>
<br>



## 4. MongoDB와 PostgreSQL을 분리한 이유 

채팅 시스템을 만들면서 가장 기본적이지만 중요한 질문이 있었다

`“모든 데이터를 한 DB에 넣으면 안 돼?”`

실시간 채팅 시스템에서는 읽기/쓰기 패턴, 데이터 정형성, 유지 기간 등이 각각의 데이터에 따라 매우 다르다.
고민 끝에 다음과 같은 기준으로 저장소를 나누기로 했다.

###  ✅ 채팅 메시지 → MongoDB
실시간 채팅 시스템은 생각보다 쓰기 트래픽이 집중적으로 발생하는 구조다.
수많은 유저가 동시에 메시지를 보내기 때문에 고민 끝에 쓰기 부하를 견딜 수 있는 저장소,
즉 MongoDB를 메시지 저장소로 선택했다.
> 
```json
{
  "_id": "msg-202504181830-uuid",
  "roomId": "room-123",
  "senderId": "user-456",
  "message": "안녕하세요",
  "createdAt": "2025-04-18T18:30:00Z"
}
```


### ✅ PostgreSQL은 정형 데이터와 정합성을 위한 선택

PostgreSQL(RDB) 은 채팅 시스템의 **구조와 상태를 정확하게 관리하기 위해 꼭 필요한 축이었다.

- 채팅방 정보
- 유저별 채팅방 참여 상태




> ***“채팅 시스템은 단순한 메시지 스트림이 아니다. 유저, 채팅방, 참여자 관계, 상태 같은 구조화된 상태 데이터를 정확히 관리해야 한다.”*** 
>
>그래서 우리는 메시지는 MongoDB로, 채팅방 정보와 상태 기반 데이터는 PostgreSQL로 분리해 저장했다. 이 분리는 확장성과 정합성을 동시에 유지할 수 있는 핵심 설계 전략이었다.



---

<br>
<br>


# 실시간 채팅 시스템 트러블슈팅– “인가 처리부터 Kafka 파티션까지”



## 1. 인가는 어디까지 해야 하나? 

처음에는 @MessageMapping("/chat.send") 같은 메서드에서도 매번 인가(Authorization) 검사를 넣는 게 안전하다고 생각했다. 하지만 이건 실시간성과 코드 복잡도를 모두 해친다는 걸 알게 됐다.

### ✅ Connect 시점에만 인가
WebSocket은 CONNECT 시점에 STOMP 헤더로 JWT 토큰을 넘길 수 있다. 이 타이밍에 다음을 처리했다 
`JWT 파싱` →  `Redis에 세션 정보 저장` (accountId, consumerId, sessionId 등), 이후 메시지 전송(send) 이벤트에서는 “`이 유저는 이미 인증된 세션이다`”는 전제하에 인가 검사를 생략했다.

> ❌ 처음엔 이런 구조를 기대했다
> 
> “HTTP 요청처럼 WebSocket도 처음 연결(핸드셰이크) 시점에 토큰을 Authorization 헤더로 넘기고, 서버에서 검증하면 깔끔하지 않을까?”
> 
> 하지만 현실은 완전히 달랐다.
>
> 🤯 WebSocket 핸드셰이크의 한계
> WebSocket 프로토콜(RFC 6455)에서 표준 헤더에 Authorization을 넣는 건 제한적
> 
> 결국, 핸드셰이크 시점에서 JWT를 받아 처리하는 건 브라우저 환경에서 현실적으로 어렵다는 결론에 도달했다.



## 2.Kafka 파티션 전략... 그 전에 생각했던 것들

Kafka 컨슈머에 파티션을 할당할 수 있다는 것을 알지 못했을때 초반에는 
“Kafka 메시지를 브로드캐스트해야 하는데… 어떻게 모든 인스턴스에 퍼뜨리지?”라는 고민을 했다. 그리고 그때는 이런 대안들을 떠올렸다:

### ✅ Redis Pub/Sub
- 메시지 유실 가능성 존재
- 장애 복구 어려움
- 컨슈머 수가 많아질수록 Redis에 부담

### ✅  gRPC 메시지 브로드캐스트  
- 각 VM 간 메시지 전송을 gRPC로 처리
- 모든 인스턴스에 메시지를 직접 전달하는 구조
- 실제로는 운영 복잡도

---

<br>
<br>


#  마치며 - 

처음엔 “그냥 메시지 주고받으면 되잖아?”에서 시작했다.
WebSocket 연결만 되면 되는 줄 알았고, 인증도 JWT 하나면 충분하다고 생각했다.

그런데 하나씩 붙여가다 보니 문제가 터졌다.
어디서 인증할 건지, 세션은 어디에 둘 건지,
누가 메시지를 받아야 하는지,
메시지는 어디에 저장하고, 어떻게 지워야 하는지…
기능 하나 추가할 때마다 생각해야 할 게 더 늘어났다.

결국 Kafka, Redis, MongoDB, PostgreSQL을 쓰게 된 것도
뭔가 대단한 기술을 써보고 싶어서가 아니라,
그게 아니면 안 되는 이유가 생겼기 때문이었다.

되돌아보면 “메시지를 어떻게 보내느냐”보다
“누가 받아야 하느냐”, “그걸 어떻게 추적하고 보장할 거냐”가
훨씬 더 중요했고, 더 복잡한 문제였다.

기능 구현은 쉬웠다.
진짜 어려운 건 동작하는 시스템을 만들기 위한 구조를 고르고,
그 흐름을 일관되게 유지하는 것이었다.


