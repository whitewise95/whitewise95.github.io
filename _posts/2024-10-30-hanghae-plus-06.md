---
layout: post
title: "[항해플러스:백엔드] 6주차 - 동시성문제 극복"
date: 2024-10-30 00:00:00 +0900
categories: [항해플러스]
tags: [항해플러스, 백엔드, 회고]
permalink: /hanghae-plus/hanghae-plus-06/
---

> 원문: https://velog.io/@whitewise95/항해플러스백엔드-6주차-동시성문제-극복

![](https://velog.velcdn.com/images/whitewise95/post/f069ce17-0e55-48b4-b6ea-8291319db08d/image.jpg)

---

# 📕 Chapter 3-1
## 1. 들어가는 말

항해플러스 백엔드과정을 끝내고 취업하고 두 달 정도가 흘렀다. 그 동안 바빠서 복습과 정리하지 못한 항해플러스에서 배우고 경험한 내용을 다시 복습하고 리팩토링하며 정리하려고 한다.


## 2. Chapter 3-1 과제

동시성 문제와 극복에 대한 내용으로 `Chapter 3-1` 이 구성되어 있다.

각 유즈케이스에 대한 적절한 동시성문제를 분석하고 DB 락, Redis 분산락 등 다양한 해결방법 적용 케이스에 대해 비교해보고 어떤 락을 쓸지 결정하고 토대로 비즈니스 로직 개선 후 통합테스트 작성하면 된다. 



# 📕 과정

## 1. UseCase - 유저 잔액 충전 
   
낙관락은 우선 충돌할 가능성이 낮을 경우 사용한다고 알고 있어서, 한 유저가 동시에 충전할 가능성이 낮기 때문에 낙관락을 사용하기로 했다.

낙관락은 ` @Retryable(value = Exception.class, maxAttempts = 100)` 이 어노테이션으로 충돌을 날 때마다 재시도를 하도록 했다. 

근데 추가로 낙관락이 과연 충돌이 낮으면 비관락보다 빠른지 낙관락과 비관락을 1000명 10명 3명으로 테스드를 해봤는데 테스트 결과는 충격적이였다.

`@Retryable`의 재시도 비용이 커서 낙관락이 비관락보다 매우 느렸다. 


### 테스트코드
> 낙관락,비관락 동일한 테스트코드로 테스트

```java
  @Test
  public void 유저잔액조회기능_유저정보없으면_에러나는지_동시성_낙관락_통합테스트() {
    //given
    String userName = "백현명";
    int chargeAmount = 1500;

    //when$
    User saveUser = userService.saveUser(userName);

    // 19개의 CompletableFuture 생성
    CompletableFuture<?>[] futures = IntStream.range(0, 10)
        .mapToObj(i -> CompletableFuture.runAsync(() -> userService.chargeUserAmount(saveUser.getId(), chargeAmount)))
        .toArray(CompletableFuture[]::new);

    // 모든 CompletableFuture가 완료될 때까지 대기
    CompletableFuture.allOf(futures).join();

    User when = userRepository.findById(saveUser.getId()).get();
    userRepository.delete(when);

    //then
    assertEquals(when.getId(), saveUser.getId());
    assertEquals(when.getName(), saveUser.getName());
    assertEquals(chargeAmount * 10, when.getAmount());
  }
}
```


### 낙관락
> `1000명` - 8초 586ms
![스크린샷 2024-07-26 오전 12 21 17](https://github.com/user-attachments/assets/2aad5fc6-a389-4661-be94-29d40fa16dc1)

>`10명` - 6초 542ms
![image](https://github.com/user-attachments/assets/d1f90cf9-fdeb-4f80-8043-8fd8ca1212ab)

> `3명` - 2초 477ms
![image](https://github.com/user-attachments/assets/329c2d6e-a6dd-46ad-a451-48daca6527a7)

<br>
<br>


### 비관락
> `1000명`  2초 591ms
![스크린샷 2024-07-26 오전 12 03 56](https://github.com/user-attachments/assets/6f19f08d-8129-492a-b745-697e58588686)


> `10명` 412ms
![image](https://github.com/user-attachments/assets/50fc2c82-1060-4078-be83-389f24888bd6)

> `3명`  410ms
![image](https://github.com/user-attachments/assets/9d0072a8-4a11-4100-a51c-9ae46f8db5e1)

<br>
<br>


## 2. UseCase - 주문 API 
주문 API는 비관락를 바로 사용하기로 결정했다. 

`첫번째 분산락`에 대해서는 레디스의 분산락은 key-value로 락을 걸 수 있는데 내 어플리케이션은 주문시 상품을 여러개를 주문할 수 있어서 여러 상품의 재고를 동시에 감소시키는 작업에서는 데이터베이스 락을 사용하는 것이 더 직관적이고 효과적일 수 있다고 생각했다.  

`두번째 낙관락`에 대해서는 주문자체는 e커머스에서 충돌이 가장 많은 곳이라고 생각하는데 거기에 상품재고와 유저의 잔액을 전부 낙관으로 처리하기에는 충돌이 배로 많을 것 같다는 생각이 했다 

`@Retry` 로 관리하더라도 비용이 커서 비관락보다 더 느릴 것으로 예상했다.  


### 비관락
> `1000명`   - 6초 444ms
![스크린샷 2024-07-26 오전 12 45 27](https://github.com/user-attachments/assets/9095f3a9-5714-4d83-9f86-f0274f9928ad)


> `10명`  - 548ms
![image](https://github.com/user-attachments/assets/b4b49055-596b-4030-8fba-9e664c68b12f)


> `3명`  - 491ms
![image](https://github.com/user-attachments/assets/cb1c6aaf-a435-4116-ab1d-88ba3af96e53)


<br>
<br>
<br>
<br>

# 📕 개인적인 락 특징과 단장점
## 1. 낙관적 락
> 데이터가 충돌할 가능성이 낮다고 가정하고, 트랜잭션이 끝날 때까지 데이터에 대한 락을 걸지 않는다.

###  `장점`
- 락을 걸지 않기 때문에 성능이 뛰어나다.

###  `단점`
- 충돌이 발생하면 재시도가 필요하다. 
- 충돌 처리 로직이 필요하다.

## 2. 비관적 락 
> 데이터가 충돌할 가능성이 높다고 가정하고, 데이터에 접근할 때마다 락을 건다.

### `장점`
- 충돌 발생 가능성이 낮아 충돌 처리 로직이 단순하다.

### `단점`
- 락을 걸기 때문에 성능이 저하될 수 있다.
- 잘못된 락 관리로 인해 데드락이 발생할 수 있다.


# 📕 분산락 
