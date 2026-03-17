---
layout: post
title: "[항해플러스:백엔드] 1주차 -  TDD, 동시성 문제 해결 과정 회고"
date: 2024-06-22 00:00:00 +0900
categories: [항해플러스]
tags: [항해플러스, 백엔드, 회고]
permalink: /hanghae-plus/hanghae-plus-02/
---

> 원문: https://velog.io/@whitewise95/항해플러스백엔드-1주차-TDD-동시성-문제-해결-과정-회고


--- 

# 1.시작하는 말
항해 플러스(이하 항플)를 진행하면서 내일배움캠프(이하 내배캠)까지 진행하는게 힘들 수도 있다고 느낀 한 주 였다. 

내배캠과 항플를 동시에 신청했는데 DM이 왔다.
![](https://velog.velcdn.com/images/whitewise95/post/b9774e86-fbdf-43c8-97ee-cbf2e5f09d5a/image.png)

이 이후에도 많은 대화를 나눴고 나는 아래와 같은 DM으로 답변을 드렸다.

![](https://velog.velcdn.com/images/whitewise95/post/caee3488-8239-4ffb-af9b-a483525e7a67/image.png)

나의 의지를 보셨는지 이해를 해주시고 이야기가 끝났다. 

5일 동안 하루에 2~3시간 밖에 못 잔 것 같다.
많이 힘들었지만...우여곡절 내배캠 프로젝트도 잘 마무리하고 항플의 과제도 성공적으로 끝난 것 같다. 

오늘은 항플을 하면서 과제한 과정이나 회고를 작성해보려고한다.

# 2.항플 과제 

## 📕 이번 과제
`step1` : TDD 작성 하기 
`step2` : 동시성 문제를 해결하고 통합테스트 작성해보기


## 📕 step 1 과정

테스트코드는 작성해봤지만 TDD나 통합테스트 이런 개념들이 없이 공부한다는 느낌으로 막 작성했던 기억말고는 없었고 그것마저도 1년이상 지나서 기억이 가물가물 했다.

그래서 TDD는 내가 했던 테스트코드와 무엇이 다른지 알아야 했고 TDD는 뭐고 통합테스트와는 어떻게 다른지 공부를 했다.

하지만 TDD과 통합테스트의 개념은 어느정도 감을 잡았지만 코드를 어떻게 작성해나가야 할 지 감이 오지 않았고, 팀원들이 공유해준 TDD 코드들로 TDD의 실제 적용 사례를 학습하고 코치님들과의 QnA 시간에 많은 대화를 나누면서 다양한 접근 방식을 이해하게 되었다.

나름 코드 작성전에 top-down방식으로 설계를 해봤다.

1. 비지니스로직의 구현을 최소화한다.

```java
  @PatchMapping("{id}/charge")
  public UserPoint charge(
      @PathVariable long id,
      @RequestBody long amount
  ) {
    return pointService.charge(id, amount);
  }
```


```java
  public UserPoint charge(long id, long amount) {
      UserPoint getPoint = pointRepository.selectById(id);
      UserPoint userPoint = pointRepository.insertOrUpdate(getPoint.id(),
          getPoint.point() + amount);
      pointRepository.insert(id, amount, TransactionType.CHARGE, System.currentTimeMillis());
      return  userPoint;
  }
```

2. 구현된 비지니스로직에 맞춰서 TDD를 실패케이스를 우선적으로 작성한다.
```java
  /**
   * 유저의 포인트를 충전시 음수를 입력하면 예외가 발생하는지 확인하는 테스트
   */
  @Test
  public void givenNegativeAmount_whenChargeById_thenThrowsException() {
    //given
    long id = 1L;
    long chargePoint = -1000L;

    //when
    String errorMessage = null;
    Exception exception = null;

    try {
      pointService.charge(id, chargePoint);
    } catch (IllegalArgumentException e) {
      exception = e;
      errorMessage = e.getMessage();
    }

    //then
    assertThat(exception).isNotNull();
    assertThat(errorMessage).isNotNull();
    assertEquals(errorMessage, "충전금액은 0보다 커야합니다.");
  }
```

3. 작성된 실패케이스를 성공하기위해 비지니스로직을 수정해준다.
```java
  public UserPoint charge(long id, long amount) {
  //region 추가된 부분
    if (amount < 0) {
      throw new IllegalArgumentException("충전금액은 0보다 커야합니다.");
    } 
  //endregion
 
  // .. 기존 로직 생략   
```

이렇게 순서로 TDD를 작성해가면, TDD가 완료될 땐 비지니스로직도 완료되는 경험을 할 수 있다.

## 📕 step2 과정
step2는 금요일 제출이였는데, 그 전에 QnA 시간과 멘토링시간이 있었기 때문에 많은 힌트들과 많은 정보들을 얻을 수 있었기 때문에 step1이 3일이상 걸린거에 비해 step2는 2~3시간만에 완료했다.

`step2`는 `step1`에서 구현은 비지니스로직의 동시성문제를 해결하고 통합테스트를 작성하는 것이였다. 

step1에서 작성했던 `charge` 메소드에 동시에 여러 요청이 들어온다면을 생각하며 테스트코드를 작성하고 비지니스로직을 작성했다 .

난 당연히 통합테스트는 http 통신으로 통합테스트 작성하는 걸로 알고 있었는데 잘 못 알고 있었나보다, 아래와 같이 코드를 작성했지만 HttpEntity 를 활용한 요청보다는 해당 서비스를 주입받아 통합 테스트 하는게 좀 더 적합한 시도일 수 있다는 피드백을 받았다. 

```java
 @Test
  public void 동시성테스트_포인트_적립() {
    // given
    long point1 = 1000L;
    long point2 = 2000L;
    long point3 = 3000L;
    long accountId = 1L;
    String url = "/point/" + accountId + "/charge";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    //when
    CompletableFuture.allOf(
        CompletableFuture.runAsync(() -> {
          HttpEntity<Long> request = new HttpEntity<>(point1, headers);
          restTemplate.exchange(
              url,
              HttpMethod.PATCH,
              request,
              Void.class
          );
        }),

        CompletableFuture.runAsync(() -> {
          HttpEntity<Long> request = new HttpEntity<>(point2, headers);
          restTemplate.exchange(
              url,
              HttpMethod.PATCH,
              request,
              Void.class
          );
        }),

        CompletableFuture.runAsync(() -> {
          HttpEntity<Long> request = new HttpEntity<>(point3, headers);
          restTemplate.exchange(
              url,
              HttpMethod.PATCH,
              request,
              Void.class
          );
        })
    ).join();

    //then
    UserPoint userPoint = postsRepository.selectById(accountId);
    assertEquals(userPoint.id(), accountId);
    assertEquals(userPoint.point(), point1 + point2 + point3);
  }
```



이 테스트코드를 만족하기 위해 락은 ConcurrentHashMap를 사용해 유저의 id값을 키로 해서 ReentrantLock을 사용해 락을 걸었다.

```java
  private final ConcurrentHashMap<Long, ReentrantLock> userTable = new ConcurrentHashMap<>();

```

```java
  public UserPoint charge(long id, long amount) {
    if (amount < 0) {
      throw new IllegalArgumentException("충전금액은 0보다 커야합니다.");
    }

    //각 회원들을 독립적인 동시성을 보장하기위해
    ReentrantLock lock = userTable.computeIfAbsent(id, accountId -> new ReentrantLock());
    lock.lock();

    try {
      UserPoint getPoint = pointRepository.selectById(id);
      UserPoint userPoint = pointRepository.insertOrUpdate(getPoint.id(),
          getPoint.point() + amount);
      pointRepository.insert(id, amount, TransactionType.CHARGE, System.currentTimeMillis());
      return userPoint;
    } finally {
      lock.unlock();
      userTable.remove(id);
    }
  }
```


# 3.회고 

## 📕 문제 
> 과제, 프로젝트를 진행하면서 부딪혔던 기술적인 문제

기술적인 문제라기보다는 방향성에 대해 많은 갈등이 있었던 것 같습니다.

특히, 이번 과제는 이미 주어진 프로젝트 소스에서 작업을 진행하는 방식이었는데, 주어진 소스는 제가 지금까지 진행했던 프로젝트와 다른 패키지 구조를 가지고 있어서 어떻게 하면 이 패키지 구조를 해치지 않고 자연스럽게 제 코드를 녹여낼 수 있을지 고민을 많이 했습니다.

또한, TDD(Test-Driven Development)를 작성해본 적이 없고 가이드라인도 보지 못한 상태에서는 무엇부터 시작해야 할지 방향을 잡기가 힘들었습니다.


## 📕 시도
> 문제를 해결하기 위해 어떤 시도를 하셨나요?

`첫 번째로`, 
TDD와 제가 알고 있는 테스트에 대한 마이그레이션이 필요했습니다. 제가 알고 있는 테스트가 TDD인지 통합 테스트인지 아니면 두 가지가 섞인 것인지에 대해 명확히 알지 못했기 때문에 이를 명확히 하기 위해 많은 노력을 기울였습니다.

`두 번째로`, 
TDD를 어떤 코드부터 작성해야 할지 여러 사람들의 TDD 작성 코드를 보며 분석했습니다. 이를 통해 TDD의 실제 적용 사례를 학습하고, 다양한 접근 방식을 이해할 수 있었습니다.

`세 번째로`,
제가 공부하고 분석한 TDD에 대한 지식을 바탕으로 발제 내용을 다시 검토하고, 제가 코드를 어떻게 작성할지를 설계했습니다. 이를 통해 프로젝트의 방향성을 정립하고, 명확한 목표를 설정할 수 있었습니다.


## 📕 해결
> 문제를 어떻게 해결하셨나요?

방향성에 대해 많은 갈등이 있었고, 이를 해결하기 위해 다양한 방법으로 공부하고 많은 코드를 보면서 어떻게 작성할지 설계했습니다. 특히, TDD와 제가 알고 있는 테스트 방법들 사이의 차이를 명확히 이해하기 위해 유튜브 강의를 시청하고 구글링을 통해 자료를 찾았습니다.

그 후, 직접 부딪혀 보기 위해 코드를 작성해 나갔습니다. 틀리든 맞든, 우선 제가 배우고 보고 느낀 부분을 코드로 표현했습니다. 이를 통해 실제로 코드를 작성하며 느낀 점들과 개선해야 할 점들을 파악할 수 있었고, 이런 과정이 저의 개발 역량을 크게 향상시켰습니다.

이와 같은 과정을 통해, 기술적인 문제뿐만 아니라 방향성에 대한 갈등을 극복하고, 새로운 패키지 구조와 TDD 방법론을 프로젝트에 자연스럽게 녹여낼 수 있었습니다.


## 📕 알게된 것

> 문제를 해결하기 위해 시도하며 새롭게 알게된 것은 무엇인가요? 

✅ TDD와 통합테스트의 대한 개념을 알게 되었다.
✅ TDD를 작성하는 방법은 Top-down과 Bottom-up 방식이 있다는 것을 알게 되었다. 
✅ TDD를 작성하는 거에 자심감을 얻었다.

---

## 📕 Keep : 현재 만족하고 계속 유지할 부분
> 이번 주를 마무리 하며 나에게 만족했던 부분은 무엇인가요?

✅ TDD와 통합 테스트에 대한 개념을 명확히 이해하고, 이를 실제 코드 작성에 적용할 수 있게 된 점.

✅ TDD 작성 방법에 대해 다양한 접근 방식을 학습하고, 이를 통해 자신감을 얻은 점.

✅ 주어진 프로젝트 소스의 패키지 구조를 해치지 않고 자연스럽게 제 코드를 녹여낼 수 있었던 점

✅ 다양한 자료를 통해 학습하고, 이를 바탕으로 명확한 목표를 설정하고 프로젝트를 진행한 점.

## 📕 Problem : 개선이 필요하다고 생각하는 문제점
> 이번 주를 마무리 하며 개선이 필요하다고 생각했던 문제점은 무엇인가요?

✅ P1. TDD와 통합 테스트를 처음 접하다 보니, 초기에는 방향을 잡는 데 시간이 많이 걸렸고 이로 인해 프로젝트 진행 속도가 다소 느렸던 점 

✅ P2. 새로운 패키지 구조에 적응하는 데 시간이 걸려, 코드 작성 초기에는 효율적으로 작업하지 못했던 점.

✅ P3. TDD와 통합 테스트 작성에 있어 아직도 부족한 부분이 있어 더 많은 연습과 경험이 필요하다고 느낀 점.

## 📕  Try : 문제점을 해결하기 위해 시도해야 할 것
> 이 문제점을 해결하기 위해 다음 한 주간 시도 할 것은 무엇인가요? 

✅ P1을 해결하기 위해, TDD와 통합 테스트에 대한 더욱 심도 있는 학습을 진행하고, 다양한 예제 코드를 작성해보며 실전 감각을 키우겠습니다.

✅ P2를 해결하기 위해, 새로운 패키지 구조에 대한 이해를 높이기 위해 더 많은 시간을 투자해 분석하고, 이를 통해 효율적인 코드 작성 방법을 모색하겠습니다.

✅ P3을 해결하기 위해, 프로젝트 외에도 개인적으로 TDD와 통합 테스트를 적용한 작은 프로젝트를 진행해보며 실습을 통해 경험을 쌓겠습니다.
