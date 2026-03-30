---
layout: post
title: "[TIL][Spring Batch] 출석 리마인드 푸시 배치 트러블슈팅 2 - @StepScope와 JobParameter"
date: 2026-03-30 21:30:00 +0900
categories: [TIL]
tags: [spring-batch, jobscope, stepscope, job-parameter, troubleshooting]
---

배치 실행 날짜(`runDt`)를 받기 위해 `@Value("#{jobParameters['runDt']}")`를 사용했는데, 컨텍스트 초기화 단계에서 바로 터졌습니다.

## 문제 상황

```text
SpelEvaluationException: Property or field 'jobParameters' cannot be found
```

Reader는 단순 `@Component`로 등록되어 있었습니다.

```java
@Component
@RequiredArgsConstructor
public class AttendanceReminderPushJobReader extends AbstractItemStreamItemReader<Long> {

    @Value("#{jobParameters['runDt']}")
    private LocalDate runDt;
}
```

## 원인

핵심은 빈 생성 시점 차이였습니다.

- 일반 `@Component` 빈: 애플리케이션 시작 시 생성
- `jobParameters`: 배치 Job 실행 시점에 생성

즉, 아직 Job이 돌기 전인데 스프링이 `jobParameters`를 평가하려다 실패한 것입니다.

## 해결

Reader를 `@StepScope`로 선언해 지연 생성되도록 변경했습니다.

```java
@StepScope
@Component
@RequiredArgsConstructor
public class AttendanceReminderPushJobReader extends AbstractItemStreamItemReader<Long> {

    @Value("#{jobParameters['runDt']}")
    private LocalDate runDt;
}
```

필요에 따라 Step 단위가 아니라 Job 단위 공유가 필요하면 `@JobScope`를 고려할 수 있습니다.

## 배운 점

- Job Parameter를 참조하는 컴포넌트는 스코프 설계가 먼저입니다.
- 배치에서 "코드는 맞는데 실행이 안 되는" 문제 대부분은 생명주기(Bean lifecycle)에서 시작됩니다.

## 체크리스트

- `@Value("#{jobParameters[...]}")`를 쓰는가?
- 해당 빈이 `@StepScope` 또는 `@JobScope` 인가?
- LocalDate/LocalDateTime 파라미터 포맷 변환 정책은 정해두었는가?
