---
layout: post
title: "[항해플러스:백엔드] 2주차 - 아키텍처, 동시성을 해결할 프로젝트 개발기  "
date: 2024-06-30 00:00:00 +0900
categories: [항해플러스]
tags: [항해플러스, 백엔드, 회고]
permalink: /hanghae-plus/hanghae-plus-03/
---

> 원문: https://velog.io/@whitewise95/항해플러스백엔드-2주차-아키텍처-동시성을-해결할-프로젝트-개발기

![](https://velog.velcdn.com/images/whitewise95/post/b0730a87-a357-456f-993a-96b3bc0c490f/image.png)


---

# 1. 들어가는 말 

이번 과제는 자신이 있었다 

레이어드아키텍처를 활용한 확장성있는 ERD 설계와 기능구현 그리고 락을 사용한 동시성 문제를 해결하는 과제였다.

레이어드아키텍처는 ERD설계 그리고 기능구현이야 일로 지겹도록 한 일이라 자신이 있었고 동시성 문제도 재고관리할 때 한번 공부하고 사용해봐서 Lock에 대해서 리마인드하고 프로젝트를 진행하면 편안하게 할 수 있지 않을까? 라는 생각으로 임하게되었다. 


# 2. 과정 

토요일 오후 2시 발제가 시작되었다. 
1주차 과제는 노력?을 봐주시고 합격을 했는데 2주차도 전부 합격하고 싶다는 욕심이 생겼다. 


## 📕 발제 

자신이 원하는 아키텍처를 사용해 특강 신청 서비스 서버를 구축하는 것이다.

우선 기본적으로 아래와 같은 API Specs과 기술등의 요구사항이 있었다,
- 특강 신청 API
- 특강 신청 여부 조회 API
- ERD 설계
- 사용한 아키텍처를 잘 사용했는지


## 📕 ERD 설계 

![](https://velog.velcdn.com/images/whitewise95/post/2fd4ddf3-a585-458c-a3e1-9bec45284d64/image.png)

비지니스가 아니다보니 시간을 더 효율적을 사용하기위해 요구사항 보다 오버해서 설계하지 않도록 했다. 예를들면 요구사항에 없는 회원을 만들었을니 간단한 이름만 있는 테이블을 설계하는 느낌!

#### account(회원)
회원이 가입할 때마다 데이터 적재하는 테이블 

####  lectures(강의영상)
강의영상을 등록할 때마다 적재되는 테이블 

####  lectures_schedule(강의 스케줄)
lectures의 데이터로 여러 강의스케줄을 만들 수 있다. 
정원, 특강일을 컨트롤할 수 있는 구조로 설계

####  lectures_schedule_account(강의 수강생목록)
강의를 신청해서 성공했을 때 데이터가 적재되는 테이블,
회원과 강의스케줄의 다대다 테이블이다.

####  lectures_schedule_account_history (강의 수강신청 히스토리)
강의를 신청해서 성공이든 실패든 그 히스토리데이터를 적재하는 테이블,
회원과 강의스케줄의 다대다 테이블이다.



## 📕 사용한 아키텍처  

익숙한 레이어드 아키텍처를 선택했다.

하지만 기존의 상위계층이 하위계층을 참조하다보면 DB 중심으로 개발이 진행되다보니 비즈니스 로직이 보호받지 못하는 단점이 존재하기에 Business와 Datasource 사이에 interface를 두어 DIP를 적용시키고 

각 계층마다 Presentation에는 DTO, Busines에는 DomainEntity, DataSource에는 JpaEntity를 두고 각 계층이 참조하고 있는 계층에게 알맞는 POJO나 Entity로 Convert해서 주도록 하였다.

![](https://velog.velcdn.com/images/whitewise95/post/2ceaf7e2-204d-4a19-b0e3-285161e6b389/image.png)
![](https://velog.velcdn.com/images/whitewise95/post/dde68001-36aa-4e22-8192-25e96554e454/image.png)



## 📕 기능 구현과 Test
Test는 Bottom-up 방향으로 Unit Test 부터 하고 기능구현은 Top-down 방향으로 controller부터  개발했으며, TDD로 방법론으로 프로젝트를 진행했다.

TDD와 구현 방향은 지난 주에서 배운 내용대로 진행했고 한번 이렇게 해보니 Test가 완료되는 시점에 기능구현도 완료가 된 느낌이라서 이런 방법으로 진행하는게 좋은 것 같다.

즉, 내 프로젝트 진행 순서는 아래와 같다.

1. controller Test Code 작성한다. 
2. controller 개발을 진행한다.
3. Test가 성공하는지 확인한다. 
4. service Test Code 작성한다. 
5. service 개발 진행한다.
6. Test가 성공하는지 확인한다. 
7. repository 개발 
8. 프로젝트 완료 


## 📕 다수의 인스턴스와 동시성
다수의 인스턴스로 어플리케이션이 동작하더라도 기능에 문제가 없어야하며, 동시성 문제도 해결해야한다.

우선 `다수의 인스턴스라면 DB락을 사용`해야 한다고 판단했고 그 중에 `낙관적 락`과 `비관적 락`을 공부하게 되었다.

### ✅ 낙관적 락
낙관적락은 컬럼으로 version을 두고 update시 version 체크를해 현재 DB에 있는 버전과 맞으면 자신이 수정하려는 컬럼중에 version도 +1를 하여 이전 버전을 가지고 있는 유저에게 update를 하지 못하도록 막는 방법이다. 


### ✅ 비관적 락
비관적락은 DB의 특정 row에 대한 접근을 미리 제한하는 방법이다. 


### ✅ 무엇을 사용하지?
낙관적 락이 더 좋다 비관적 락이 더 좋다 라는 것 보다는 각 장단점이 있기때문에 자신의 상황에 맞게 쓰는게 좋다. 

예를 들면 `해당 기능을 사용하는 유저이 매우 작을 것으로 예상`해서 성능을 최적화하고 싶다면 `낙관적락을 사용`해 성능을 확보하는 방안으로 가고, `반대로 일관성이 매우 중요`하고, `충돌이 자주 발생할 것으로 예상`된다면 데이터의 일관성과 무결성을 보장하기 위해 `비관적 락을 사용`하는 게 좋다.

나는 현재 강의 수강생이 몇 명인지 트랜잭션마다 일관성있는 데이터가 필요했기 때문에 비관적 락을 사용했다. 

강의 신청 비지니스 로직은 아래와 같다. 

```java
  /**
   * 수강 신청
   */
  @Transactional
  public Boolean registerLecture(Long accountId, Long lecturesScheduleId) {
    // 유저 체크
    Account account = accountRepository.getAccount(accountId);

    //강의가 있는 강의인지 체크
    LecturesSchedule lecturesSchedule = lecturesRepository.getLectureSchedulerByLectureSchedulerId(lecturesScheduleId);

    //이미 신청한 강의인지 체크
    if (lecturesRepository.existsLectureSchedulerAccountByAccountIdAndLecturesScheduleId(accountId, lecturesScheduleId)) {
      throw new IllegalArgumentException("이미 신청한 특강입니다.");

      // 현재 강의가 몇명까지 지원이 가능한지 체크 
    } else if (lecturesSchedule.isMaxCapacity()) {

      // 정원이 30명이면 fail -> history 생성
      saveLecturesScheduleAccountHistory(lecturesSchedule.id(), account.id(), false);
      return false;
    }

    //성공하면 수강생을 등록하고 히스토리 생성하고 현재 강의 수강생인원을 update 해준다.
    lecturesRepository.registerLecture(accountId, lecturesScheduleId);
    lecturesRepository.updateLectureSchedulerByLectureSchedulerCurrentCapacity(lecturesScheduleId);
    saveLecturesScheduleAccountHistory(lecturesSchedule.id(), account.id(), true);
    return true;
  }
```


### ✅비관적 락을 사용한 로직
일관성있는 데이터는 아래 코드와 같이 현재 강의의 수강생이 몇명인지 체크하는 로직에서 필요했다.
```java
 else if (lecturesSchedule.isMaxCapacity()) {
```


그래서 request로 준 강의 UUID가 실제로 있는 데이터 있는지 체크하는 `getLectureSchedulerByLectureSchedulerId` 메소드에서 JPA 사용시 Rock을 걸어주었다. 

- service
```java
 //강의가 있는 강의인지 체크
    LecturesSchedule lecturesSchedule = 
    lecturesRepository.getLectureSchedulerByLectureSchedulerId(lecturesScheduleId);
```

- repositoryImpl
```java
  @Override
  public LecturesSchedule getLectureSchedulerByLectureSchedulerId(Long lecturesScheduleId) {
    return lecturesScheduleJpaRepository.findByIdWithPessimisticLock(lecturesScheduleId)
        .orElseThrow(() -> new IllegalArgumentException("특강을 찾을 수 없습니다."))
        .toDomain();
  }
```

- jpaRepository
```sql
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT L from LecturesScheduleEntity L where L.id = :id")
  Optional<LecturesScheduleEntity> findByIdWithPessimisticLock(Long id);
```



### ✅ 유닛테스트 성공
CompletableFuture를 사용해 동시성테스트를 진행했고 `then` 에서 28명을을 만족하므로 테스트를 성공했다. 
```java
  @Test
  public void 특강신청_동시성_통합테스트_성공테스트() {
    //given
    Account account = accountRepository.save("유저1");
    Account account2 = accountRepository.save("유저2");
    Account account3 = accountRepository.save("유저3");
    Lectures lectures = lecturesRepository.saveLectures("https://www.youtube.com/watch?v=bu0C9np-ZE8");
    LecturesSchedule lecturesSchedule = lecturesRepository.saveLecturesSchedule(LecturesSchedule
        .builder()
        .openAt(LocalDateTime.now())
        .title("스프링 특강")
        .currentCapacity(25)
        .lecturesId(lectures.id())
        .build()
    );

    //when
    CompletableFuture.allOf(
        CompletableFuture.runAsync(() -> {
          lecturesService.registerLecture(account.id(), lecturesSchedule.id());
        }),
        CompletableFuture.runAsync(() -> {
          lecturesService.registerLecture(account2.id(), lecturesSchedule.id());
        }),
        CompletableFuture.runAsync(() -> {
          lecturesService.registerLecture(account3.id(), lecturesSchedule.id());
        })
    ).join();

    //then
    LecturesSchedule thenLecturesSchedule = lecturesRepository.getLectureSchedulerByLectureSchedulerId(lecturesSchedule.id());
    assertEquals(thenLecturesSchedule.lecturesId(), lectures.id());
    assertEquals(thenLecturesSchedule.id(), lecturesSchedule.id());
    assertEquals(thenLecturesSchedule.title(), lecturesSchedule.title());
    assertEquals(thenLecturesSchedule.openAt(), lecturesSchedule.openAt());
    assertEquals(thenLecturesSchedule.currentCapacity(), 25 + 1 + 1 + 1);
  }

```

# 3. 트러블 슈팅


## 📕 트랜잭션이 없어서 발생하는 오류

```
Query requires transaction be in progress, but no transaction is known to be in progress
```

위와 같은 에러가 계속 발생했다. 
트랜잭션이 없다는 에러이다. 
락을 사용하는데 트랜잭션이 없으니 발생한 것이다.

이상한 건 트랜잭션을 걸어주고 있는데도 계속 에러가 발생한다는 것이다.

이유는 Test Code에서 service 로직을 거쳐 repository로 간 것이 아니라 Test 코드에서 다이렉트로 repository에서 조회하고 있는 로직이 존재했고, 해당 조회문은 @Query를 사용한 JPQL로 작성했기에 트랜잭션이 필요했지만 Test Code에는 @Transactional이 없었고 걸어줄 수도 없었다.

Test Code에서 @Transactional이 필요 없게끔 코드를 바꿔주니 잘 돌아갔다.

Test 코드에서의 에러였다니... 원인을 알고나서 나는 뒤통수를 세게 맞은 것 같다.


# 4. 느낌점

이번에 레이어드 아키텍처에 DIP를 묻혀 단일 참조를 지키려하다보니 익숙하지도 않아 개발시간도 오래걸리고 많은 시행착오가 있었다

Repository는 JpaEntity(@Entity를 사용한 클래스 이하 Entity)를 사용 
Service에서는 DomainEntity(이하 domain)을 사용한다.

Repository는 domain을 알아도 되지만 Service에서는 entity를 몰라야한다는 구조로 진행했다. 

이렇게 하다보니 불편한점이 있었는데 JPA 연관관계를 맺어주기 힘들고 그러다보니 생산성과 불필요한 코드가 너무 많이 생겼다. 

## 📕 JPA 연관관계를 맺어주기 힘들다.

아래 entity를 보면 @ManyToOne이 아니라 논리적 FK를 가져가고 있다.
```java
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LecturesScheduleEntity extends BaseTimeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Comment("특강 스케줄 고유번호")
  private Long id;

  @NotNull
  @Comment("특강 오픈일")
  private LocalDateTime openAt;

  @NotNull
  @Comment("특강 제목")
  private String title;

  @NotNull
  @Comment("현재 수강 인원")
  @ColumnDefault("0")
  private Integer currentCapacity;

  @NotNull
  @Comment("특강 고유 번호")
  private Long lecturesId;
  
}
```


아래 코드는 service의 코드이고 LecturesSchedule를 생성하는 로직이다. 

```java
// LecturesSchedule를 생성하는 service로직
public void save (Long lecturesId) {
    lecturesScheduleRepository.saveLecturesSchedule(lecturesId);
}
```

service는 repositry를 알 수 없다는 규칙 때문에 lecturesEntity를 service에서 생성해 repository로 넘길 수 없다

더불어 repositry에서 lecturesId를 가지고 lecturesEntity를 생성한다면, 비지니스로직이 service에 위치한게 아니라 repository에도 존재하므로 구조가 이도저도 아닌게 되어버린다고 생각했다. 

그래서 lecturesId 넘겨주고 그냥 @ManyToOne가 아닌 lecturesId를 필드로 주고 왜래키를 역지 않는 방법으로 개발을 했다.

이렇게 개발을 하다보니 생산성이 안좋아지고 JPA를 사용하는 이점을 버리게되는 것 같았다. 

코치님들에게 많은 질문을 하고 알아본 결과 domain을 없애고 entity로만 repository와 service에서 사용하는 구조로도 많이 사용이 되고 entity는 DB의 추상화 개념이기 때문에 entity를 service에서 안다고 해서 repository를 안다고 생각하는건 오류라고 생각하다며 말씀해주셨다. 



## 📕 불필요한 코드들
repository에서 사용하는 JpaEntity(@Entity를 사용한 클래스)를 Service에서 사용하는 DomainEntity로 맵핑해주는 과정에서 불필요한 코드들도 생겼다. 연관관계를 포기했으니 service 로직에서는 LecturesScheduleEntity만 조회해도 lectures를 알 수 없어서 다시 lectures를 조회하는 성능적으로도 불리하고 불필요한 코드가 생성되는 것을 경험했다.

## 📕 정리
이를 토대로 다음에는 entity를 service와 repository에서 사용해 볼 예정이다.
현재 항플을 통해서 많은 걸 배우고 있지만 나의 identity를 확립하기에는 부족한 시간인 것 같다.

많은 연습과 시행착오들, 그리고 내가 올바르다고 믿는 것을 통해 나의 identity를 확립해야 할 것 같다.
