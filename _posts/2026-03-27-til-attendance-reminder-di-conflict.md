---
layout: post
title: "[TIL][Spring Batch] 출석 리마인드 푸시 배치 트러블슈팅 1 - DI 충돌"
date: 2026-03-27 21:20:00 +0900
categories: [TIL]
tags: [spring-batch, spring, di, troubleshooting]
---

출석 리마인드 푸시 배치를 만들면서 첫 번째로 막힌 지점은 `UnsatisfiedDependencyException` 이었습니다.

## 문제 상황

`Step` 빈을 구성할 때 `ItemReader<Long>` 인터페이스 타입으로 주입받고 있었습니다.

```java
@Bean
@JobScope
public Step attendanceReminderPushJobStep(
    ItemReader<Long> reader,
    ItemWriter<Long> writer
) {
    // ...
}
```

실행 시 다음과 같은 오류가 발생했습니다.

```text
expected single matching bean but found 9
```

## 원인

프로젝트 안에 `ItemReader<Long>` 구현체가 여러 개 있었기 때문입니다.

스프링 입장에서는 아래 질문에 답할 수 없었습니다.

- "출석 리마인드 Step에 어떤 Reader를 넣어야 하는가?"

즉, 인터페이스 기반 주입 자체는 좋은 패턴이지만, 배치 컴포넌트가 많아질수록 모호성이 커집니다.

## 해결

주입 타입을 구체 클래스로 변경해 모호성을 제거했습니다.

```java
@Bean
@JobScope
public Step attendanceReminderPushJobStep(
    AttendanceReminderPushJobReader reader,
    AttendanceReminderPushJobWriter writer
) {
    // ...
}
```

또는 `@Qualifier`를 사용할 수도 있지만, 배치 Job/Step 구성에서는 클래스명을 명시하는 방식이 더 빠르게 의도를 드러내는 경우가 많았습니다.

## 배운 점

- 구현체가 다수인 인터페이스를 Step 파라미터로 바로 받을 때는 항상 충돌 가능성을 의식해야 합니다.
- 배치 설정은 "유연성"보다 "명시성"이 운영 안정성에 더 유리할 때가 많습니다.

## 체크리스트

- `ItemReader`, `ItemWriter`, `ItemProcessor` 구현체가 2개 이상인가?
- Step 메서드 시그니처가 인터페이스로만 되어 있지는 않은가?
- 필요 시 `@Qualifier` 또는 구체 클래스 주입으로 의도를 명확히 했는가?
