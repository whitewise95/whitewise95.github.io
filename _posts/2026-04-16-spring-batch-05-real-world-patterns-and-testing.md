---
layout: post
title: "[스프링배치 5편] 실무 패턴 완성: 멀티스텝, 분기, 파티셔닝, 테스트 전략"
date: 2026-04-16 09:00:00 +0900
categories: [스프링배치]
tags: [spring-batch, multi-step, flow, partitioning, spring-batch-test, batch-architecture]
permalink: /spring-batch/spring-batch-05-real-world-patterns-and-testing/
---

## SEO 요약

Spring Batch 입문 시리즈 마지막 편에서는 실무에서 바로 쓰는 구조 패턴을 정리합니다. 멀티 Step 설계, 조건 분기(Flow), 파티셔닝 기반 병렬 처리, 그리고 `spring-batch-test`를 이용한 테스트 전략까지 한 번에 다룹니다. 단일 Step 예제를 운영 가능한 배치 아키텍처로 확장하는 것이 목표입니다.

> 작성 시점의 공식 문서 기준: **Spring Boot 4.0.x**, **Spring Batch 6.0.x**

## 시리즈 안내 (총 5편)

- 1편: 프로젝트 생성 + 첫 CSV -> DB 배치 실행
- 2편: JobParameters, 재실행/재시작, 실패 복구
- 3편: 대용량 처리 성능 튜닝(chunk/page/cursor)
- 4편: 스케줄링/운영(모니터링, 알림, 장애 대응)
- 5편(현재): 실무 패턴(멀티스텝, 분기, 파티셔닝, 테스트 전략)

---

## 목차

1. 들어가며
2. 멀티 Step Job으로 나누는 기준
3. Flow(조건 분기) 패턴
4. 파티셔닝으로 병렬 처리하기
5. 테스트 전략 (`spring-batch-test`)
6. 실무 아키텍처 체크리스트
7. 마무리

---

## 1. 들어가며

### 왜 필요한지

입문 단계에서는 단일 Step이 이해하기 쉽습니다.
하지만 실무에서는 보통 아래 요구가 붙습니다.

- 전처리 -> 본처리 -> 후처리를 분리하고 싶다
- 특정 조건에서 다른 Step으로 분기하고 싶다
- 데이터량이 커서 병렬 처리가 필요하다
- 배치를 테스트 코드로 검증하고 싶다

즉, "잘 도는 배치"에서 "변경 가능한 배치"로 넘어가야 합니다.

### 여기서 기억할 점

- 실무 배치는 기능보다 구조가 먼저입니다.

---

## 2. 멀티 Step Job으로 나누는 기준

### 왜 필요한지

한 Step에 로직이 몰리면 장애 원인 파악과 재실행 지점 제어가 어려워집니다.

### 무엇을 하는지

Step을 책임 단위로 나눕니다.

- `validateStep`: 입력 파일/파라미터 검증
- `importStep`: 핵심 데이터 적재
- `summaryStep`: 집계/통계 생성

### 어떻게 구현하는지

```java
@Bean
public Job productPipelineJob(
    JobRepository jobRepository,
    Step validateStep,
    Step importStep,
    Step summaryStep
) {
    return new JobBuilder("productPipelineJob", jobRepository)
        .start(validateStep)
        .next(importStep)
        .next(summaryStep)
        .build();
}
```

이 코드의 역할:

- 순차 실행되는 3단계 배치 파이프라인을 만듭니다.

### 실행하면 무엇이 되는지

- 실패 지점이 명확해지고,
- Step 단위 재시작/분석이 쉬워집니다.

### 여기서 기억할 점

- Step 분리는 "기술 계층"이 아니라 "운영 책임" 기준으로 나누는 게 좋습니다.

---

## 3. Flow(조건 분기) 패턴

### 왜 필요한지

배치 실행 중 상태에 따라 다음 동작이 달라지는 경우가 많습니다.

- 검증 실패 시 종료
- 검증 성공 시 본처리 진행
- 본처리 결과에 따라 후속 작업 선택

### 무엇을 하는지

ExitStatus를 기준으로 분기 Flow를 구성합니다.

### 어떻게 구현하는지

```java
@Bean
public Job conditionalJob(
    JobRepository jobRepository,
    Step validateStep,
    Step importStep,
    Step notifyStep
) {
    return new JobBuilder("conditionalJob", jobRepository)
        .start(validateStep)
            .on("FAILED").end()
        .from(validateStep)
            .on("*").to(importStep)
            .next(notifyStep)
        .end()
        .build();
}
```

이 코드의 역할:

- `validateStep` 실패면 종료하고, 그렇지 않으면 다음 Step으로 진행합니다.

### 실행하면 무엇이 되는지

- "실패했는데도 뒤 Step이 실행되는" 사고를 막을 수 있습니다.

### 여기서 기억할 점

- 분기 기준(`FAILED`, `COMPLETED`, 사용자 정의 ExitStatus`)을 팀 공통 규약으로 정하세요.

---

## 4. 파티셔닝으로 병렬 처리하기

### 왜 필요한지

단일 스레드로 처리 시간이 너무 길면 SLA를 맞추기 어렵습니다.

### 무엇을 하는지

큰 작업을 파티션으로 나누고 워커 Step을 병렬로 실행합니다.

- 예: `id` 범위를 1~100만, 100만~200만 ... 으로 분할

### 어떻게 구현하는지

```java
@Bean
public Step masterStep(
    JobRepository jobRepository,
    Step workerStep,
    Partitioner productPartitioner,
    TaskExecutor taskExecutor
) {
    return new StepBuilder("masterStep", jobRepository)
        .partitioner("workerStep", productPartitioner)
        .step(workerStep)
        .gridSize(4)
        .taskExecutor(taskExecutor)
        .build();
}
```

이 코드의 역할:

- `workerStep`을 4개 파티션으로 병렬 실행합니다.

```java
@Bean
public TaskExecutor partitionTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(4);
    executor.setMaxPoolSize(8);
    executor.setQueueCapacity(16);
    executor.setThreadNamePrefix("batch-part-");
    executor.initialize();
    return executor;
}
```

이 코드의 역할:

- 파티션 병렬 실행에 사용할 스레드풀을 설정합니다.

### 실행하면 무엇이 되는지

- 총 실행 시간을 단축할 수 있습니다.
- 대신 DB 락/인덱스 경합이 늘 수 있어 관측이 필수입니다.

### 여기서 기억할 점

- 파티셔닝은 "무조건 빠른 기능"이 아니라 "병목 위치를 바꾸는 기능"입니다.

---

## 5. 테스트 전략 (`spring-batch-test`)

### 왜 필요한지

배치는 수동 실행으로만 검증하면 회귀 버그를 막기 어렵습니다.

### 무엇을 하는지

- Job 전체 실행 테스트
- 특정 Step 단위 테스트
- 실행 결과(ExitStatus, 쓰기 건수) 검증

### 어떻게 구현하는지

```java
@SpringBatchTest
@SpringBootTest
class ProductBatchJobTest {

    @Autowired
    private JobLauncherTestUtils jobLauncherTestUtils;

    @Test
    void importProductJob_runs_successfully() throws Exception {
        JobParameters params = new JobParametersBuilder()
            .addString("baseDate", "2026-04-16")
            .toJobParameters();

        JobExecution execution = jobLauncherTestUtils.launchJob(params);

        assertThat(execution.getExitStatus().getExitCode()).isEqualTo("COMPLETED");
    }
}
```

이 코드의 역할:

- Job이 실제로 실행되어 완료되는지 자동 검증합니다.

```java
@Test
void importStep_runs_successfully() throws Exception {
    JobParameters params = new JobParametersBuilder()
        .addString("baseDate", "2026-04-16")
        .toJobParameters();

    JobExecution stepExecution = jobLauncherTestUtils.launchStep("importStep", params);

    assertThat(stepExecution.getExitStatus().getExitCode()).isEqualTo("COMPLETED");
}
```

이 코드의 역할:

- 특정 Step만 분리해서 빠르게 검증합니다.

### 실행하면 무엇이 되는지

- 배치 리팩토링 이후에도 기존 동작을 안전하게 유지할 수 있습니다.

### 여기서 기억할 점

- 배치 테스트는 "실행됐는가"보다 "의도한 결과가 나왔는가"까지 검증해야 합니다.

---

## 6. 실무 아키텍처 체크리스트

1. Step이 운영 책임 단위로 분리돼 있는가
2. 분기 Flow가 문서화돼 있는가
3. 파티셔닝 시 DB 경합 지표를 모니터링하는가
4. Job/Step 자동 테스트가 CI에 포함돼 있는가
5. 실패 시 restart/rerun 기준이 명확한가
6. 배치 설정(스레드풀, chunk, fetchSize)이 환경별로 관리되는가

### 여기서 기억할 점

- 운영 가능한 구조는 "코드"가 아니라 "기준 + 자동화"에서 나옵니다.

---

## 7. 마무리

이번 5편에서는 입문 시리즈를 실무 패턴으로 마무리했습니다.

### 이번 글 요약

- 멀티 Step으로 책임을 분리하고,
- Flow로 실패/성공 경로를 제어하고,
- 파티셔닝으로 병렬 처리 확장성을 확보하고,
- 테스트로 회귀를 막는 구조를 만들었습니다.

### 시리즈 전체 요약

- 1편: 첫 배치 실행 성공
- 2편: 재실행/재시작 이해
- 3편: 성능 튜닝 기준 수립
- 4편: 운영 체계 구축
- 5편: 실무 아키텍처 패턴 완성

다음에는 실제 서비스 도메인(정산/주문/로그 집계)에 맞춘 템플릿형 배치 설계를 다뤄보면 좋습니다.

---

## 참고한 공식 문서 주제

- Spring Batch Reference Documentation
  - Job Configuration and Flow
  - Partitioning and Scaling
  - Testing with `spring-batch-test`
  - Restartability and metadata
- Spring Boot Reference Documentation
  - Batch auto-configuration
  - Test support and application configuration

---

## 태그 추천

`spring-batch`, `multi-step-job`, `batch-flow`, `partitioning`, `spring-batch-test`, `batch-architecture`, `batch-best-practices`
