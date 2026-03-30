---
layout: post
title: "[Spring/MongoDB] 조용한 차단(Silent Block) 구현기: 선물하기 예외 처리까지"
date: 2026-03-30 21:40:00 +0900
categories: [회사생활]
tags: [spring, mongodb, kafka, websocket, fcm, ddd, chat]
permalink: /company-life/silent-block-with-gift-exception/
---

## 개요

채팅 서비스에서 **차단(Block)** 기능은 단순해 보이지만,
실제 비즈니스 요구사항이 들어오면 복잡도가 급격히 올라갑니다.

이번 글은 아래 요구사항을 만족하는 차단 기능을
Spring Boot + MongoDB + Kafka/WebSocket/FCM 환경에서 어떻게 설계했는지 정리한 구현기입니다.

## 요구사항 정리

### 1) 조용한 차단 (Silent Block)

- A가 B를 차단해도, B는 차단당한 사실을 알 수 없어야 함
- B는 메시지를 정상적으로 전송하고, 본인 화면에서도 보낸 메시지가 보여야 함

### 2) 수신자 보호

- A에게는 B가 보낸 일반 메시지 알림이 가지 않아야 함
- 대상: FCM 푸시, WebSocket 실시간 이벤트, 안 읽음 배지 증가

### 3) 비즈니스 예외 (선물하기)

- 단, 메시지 타입이 `GIFT`면 예외적으로 A에게 전달되어야 함
- 알림/채팅방 표시 모두 허용

핵심은 단순 하드 차단이 아니라,
**메시지 타입별 예외를 포함한 "선택적 무시" 정책**을 일관되게 적용하는 것입니다.

## 1. 데이터 모델링: 차단 상태를 스냅샷으로 기록

처음 고민은 "차단 여부를 매번 조회 시 계산할 것인가"였습니다.
채팅 조회마다 RDB 관계 테이블을 조인하면 쿼리 비용이 커지므로,
메시지 전송 시점의 상태를 MongoDB 메시지 문서에 저장하는 방식으로 설계했습니다.

```java
@Document(collection = "chat_room_message")
public class ChatRoomMessage {

    public enum Type {
        TEXT, IMAGE, GIFT, BEG
    }

    @Comment("메시지 타입")
    @Builder.Default
    private Type type = Type.TEXT;

    @Comment("""
        상대방(수신자)에 의한 차단 여부
        - true: 수신자가 발신자를 차단한 상태에서 발신자가 보낸 메시지
        - false/null: 정상 메시지
    """)
    private Boolean isBlock;
}
```

이렇게 하면 조회 단계에서 `isBlock` 기반 필터를 빠르게 적용할 수 있고,
관계 테이블 조인 없이도 정책을 일관되게 유지할 수 있습니다.

## 2. 실시간 이벤트 제어: Kafka/WebSocket/FCM

메시지 저장 직후, 접속 상태에 따라 Kafka(WebSocket) 또는 FCM으로 이벤트를 보냅니다.
이때 차단 정책을 전송 단계에서 적용했습니다.

```java
@Transactional
public ChatRoomMessage send(Long loginAccountId, ChatRoomMessageDto.SendRequest request) {
    // 1) 상대방이 나를 차단했는지 확인
    boolean isBlockedByPartner = commonUserFriendService.isBlocked(loginAccountId, chatPartnerAccountId);

    // 2) 메시지 저장 (차단 상태 기록)
    ChatRoomMessage chatRoomMessage = createChatRoomMessage(..., isBlockedByPartner);

    // 3) 전송 대상 필터링 (GIFT는 예외적으로 허용)
    boolean shouldSkipPartner = chatRoomMessage.getIsBlock()
        && chatRoomMessage.getType() != ChatRoomMessage.Type.GIFT;

    for (ChatRoomAccount chatRoomAccount : chatRoomAccounts) {
        Long accountId = chatRoomAccount.getAccount().getId();

        if (shouldSkipPartner && accountId.equals(chatPartnerAccountId)) {
            continue;
        }

        // Kafka/FCM 대상 분류 로직...
    }

    eventPublisher.publishEvent(new ChatRoomMessageEvent.Send(...));
}
```

읽음 처리에서도 동일한 규칙을 적용해,
차단된 상대의 화면에서 unread가 의도치 않게 줄어들지 않도록 맞췄습니다.

## 3. 조회 로직 리팩토링: 도메인으로 조건 응집

아래 세 곳에서 같은 조건이 반복됐습니다.

- 채팅방 커서 조회
- 채팅방 상세 조회
- 전체 안 읽은 개수 집계

초기에는 서비스 레이어에 쿼리 조건이 흩어져 있어 변경에 취약했습니다.
그래서 "메시지가 사용자에게 보이는 조건" 자체를 도메인 객체로 이동했습니다.

```java
public class ChatRoomMessage {

    /**
     * 특정 사용자가 이 메시지를 볼 수 있는지 판별하는 공통 쿼리 조건
     */
    public static Criteria visibleFilter(Long loginAccountId) {
        return new Criteria().orOperator(
            Criteria.where("isBlock").ne(true),          // 차단되지 않은 메시지
            Criteria.where("type").is(Type.GIFT),        // 예외: 선물하기
            Criteria.where("accountId").is(loginAccountId) // 내가 보낸 메시지
        );
    }
}
```

서비스에서는 아래처럼 재사용합니다.

```java
Criteria criteria = Criteria.where("chatRoomId").is(roomId)
    .and("type").ne("EXIT_JOIN")
    .andOperator(ChatRoomMessage.visibleFilter(accountId));

long unreadCount = mongoTemplate.count(Query.query(criteria), ChatRoomMessage.class);
```

### 왜 `is(false)`가 아니라 `ne(true)`인가?

과거 데이터에는 `isBlock` 필드 자체가 없을 수 있습니다.
`is(false)`를 쓰면 이런 문서가 누락될 수 있으므로,
`ne(true)`를 사용해 기존 데이터 호환성을 보장했습니다.

## 4. 적용 결과

- 메시지 저장 시점에 차단 상태를 고정해 조회 비용/복잡도 감소
- 실시간 알림(Kafka/FCM)과 조회 정책이 동일 규칙으로 정렬됨
- `GIFT` 예외 정책을 한 군데에서 유지 가능
- 도메인 메서드 기반으로 향후 정책 변경 대응이 쉬워짐

## 마무리

이번 작업에서 핵심은 "차단 여부" 자체보다,
**어느 시점에 상태를 기록하고, 누가 정책 책임을 갖는가**였습니다.

복잡한 요구사항일수록 아래 세 가지를 먼저 정하는 것이 유효했습니다.

- **Where**: 상태를 어디에 저장할지
- **When**: 어느 시점의 값을 신뢰할지
- **Who**: 정책 책임을 어떤 계층/도메인에 둘지

차단 기능처럼 예외 규칙이 많은 영역은,
Service 절차 코드보다 도메인 언어로 응집했을 때 유지보수성이 확실히 좋아졌습니다.
