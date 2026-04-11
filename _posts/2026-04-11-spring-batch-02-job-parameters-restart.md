---
layout: post
title: "[스프링배치 2편] JobParameters와 재실행/재시작: 실패해도 안전하게 다시 돌리기"
date: 2026-04-11 10:00:00 +0900
categories: [스프링배치]
tags: [spring-batch, spring-boot, job-parameters, restart, job-instance, job-execution, tutorial]
permalink: /spring-batch/spring-batch-02-job-parameters-restart/
---

## SEO 요약

Spring Batch에서 가장 헷갈리는 `JobParameters`, `JobInstance`, `JobExecution` 관계를 실제 실행 흐름으로 이해해봅니다. 같은 Job을 다시 실행할 때 왜 충돌이 나는지, 실패한 배치를 어디서부터 재시작할 수 있는지, 운영에서 안전하게 설계하는 방법까지 입문자 기준으로 정리했습니다.

> 작성 시점의 공식 문서 기준: **Spring Boot 4.0.x**, **Spring Batch 6.0.x**

## 시리즈 안내 (총 5편)

- 1편: 프로젝트 생성 + 첫 CSV -> DB 배치 실행
- 2편(현재): JobParameters, 재실행/재시작, 실패 복구
- 3편: 대용량 처리 성능 튜닝(chunk/page/cursor)
- 4편: 스케줄링/운영(모니터링, 알림, 장애 대응)
- 5편: 실무 패턴(멀티스텝, 분기, 파티셔닝, 테스트 전략)

---

## 목차

1. 들어가며
2. JobParameters / JobInstance / JobExecution 다시 잡기
3. 같은 Job을 다시 실행하면 왜 충돌할까
4. 예제로 재실행/재시작 구현하기
5. 실행 결과 해석하기
6. 실무에서 꼭 챙겨야 할 포인트
7. 마무리

---

## 1. 들어가며

### 왜 이 주제가 중요한가

1편에서는 "첫 배치를 실행"하는 데 집중했습니다.
실무에서는 그다음이 더 중요합니다.

- 배치가 실패했을 때 어떻게 다시 돌릴지
- 같은 배치를 날짜별로 안전하게 분리할지
- 실수로 중복 실행해 데이터가 꼬이지 않게 할지

Spring Batch 공식 문서도 이 부분을 핵심으로 다룹니다.
배치는 "한 번 실행"보다 **반복 실행과 복구 전략**이 본질이기 때문입니다.

### 이번 글에서 무엇을 할까

CSV -> DB 예제를 유지하면서 아래를 직접 확인합니다.

1. `JobParameters`를 붙여 실행 단위를 분리
2. 같은 파라미터 재실행 시 충돌 확인
3. 실패를 강제로 만들어 restart 동작 확인

### 여기서 기억할 점

- 배치 설계의 품질은 "실패했을 때" 드러납니다.

---

## 2. JobParameters / JobInstance / JobExecution 다시 잡기

### 왜 필요한지

용어를 모르면 로그를 봐도 무슨 일이 일어나는지 해석이 어렵습니다.

### 무엇을 하는지

핵심 세 개를 실행 관점으로 정리합니다.

- `JobParameters`: 실행 입력값 (예: `baseDate=2026-04-11`)
- `JobInstance`: `Job + JobParameters`로 식별되는 논리 실행 단위
- `JobExecution`: 실제 실행 시도 1회(성공/실패 상태 포함)

### 쉽게 이해하는 비유

- Job: "상품 적재 작업"이라는 작업 템플릿
- JobInstance: "2026-04-11 상품 적재 작업"
- JobExecution: 그 인스턴스를 실제로 돌린 시도(1차, 2차, ...)

### 어떻게 구현/확인하는지

H2 메타테이블을 조회하면 관계가 보입니다.

```sql
SELECT JOB_INSTANCE_ID, JOB_NAME
FROM BATCH_JOB_INSTANCE
ORDER BY JOB_INSTANCE_ID DESC;
```

이 코드의 역할:

- 어떤 JobInstance가 생성됐는지 확인합니다.

```sql
SELECT JOB_EXECUTION_ID, JOB_INSTANCE_ID, STATUS, START_TIME, END_TIME
FROM BATCH_JOB_EXECUTION
ORDER BY JOB_EXECUTION_ID DESC;
```

이 코드의 역할:

- 각 인스턴스가 몇 번 실행됐고 어떤 상태인지 확인합니다.

### 여기서 기억할 점

- `JobParameters`가 바뀌면 다른 `JobInstance`가 됩니다.
- 재실행/재시작 정책은 결국 이 식별 구조 위에서 동작합니다.

---

## 3. 같은 Job을 다시 실행하면 왜 충돌할까

### 왜 필요한지

입문자가 가장 자주 만나는 오류가 여기입니다.

- `JobInstanceAlreadyCompleteException`

### 무엇을 하는지

같은 파라미터로 다시 실행하면 어떤 일이 생기는지 이해합니다.

공식 문서 의미를 풀어쓰면:

- 이미 `COMPLETED`된 JobInstance는 같은 파라미터로 다시 "새 실행"할 수 없습니다.
- 같은 파라미터로는 "동일한 논리 실행 단위"로 보기 때문입니다.

### 어떻게 구현하는지

실행 시 파라미터를 넘기고, 같은 값으로 두 번 실행해봅니다.

```bash
./gradlew bootRun --args="--spring.batch.job.name=importProductJob baseDate=2026-04-11"
```

이 코드의 역할:

- `baseDate=2026-04-11`인 인스턴스를 실행합니다.

같은 명령을 성공 후 한 번 더 실행하면,
이미 완료된 인스턴스라면 재실행이 막히는 것을 볼 수 있습니다.

### 실행하면 무엇이 되는지

- 의도치 않은 중복 적재를 막을 수 있습니다.
- 대신 날짜/회차 같은 식별 파라미터 설계가 필수입니다.

### 여기서 기억할 점

- "매일 1번" 배치라면 `baseDate` 같은 파라미터를 명시적으로 설계해야 합니다.

---

## 4. 예제로 재실행/재시작 구현하기

이번 섹션은 1편 코드에 최소 변경만 추가합니다.

### 4-1. JobParameters를 받는 Processor 만들기

#### 왜 필요한지

실행 파라미터를 실제 비즈니스 로직에 반영해야,
"같은 Job인데 실행 단위가 다르다"는 의미가 생깁니다.

#### 어떻게 구현하는지

`@StepScope`를 사용해 실행 시점 파라미터를 주입받습니다.

```java
package io.whitewise.batch;

import java.time.LocalDate;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductProcessorConfig {

    @Bean
    @StepScope
    public ItemProcessor<ProductCsvRow, Product> productProcessor(
        @Value("#{jobParameters['baseDate']}") String baseDate
    ) {
        LocalDate executionDate = LocalDate.parse(baseDate);
        return item -> new Product(
            item.name().trim().toUpperCase(),
            item.price(),
            executionDate.atStartOfDay()
        );
    }
}
```

이 코드의 역할:

- `baseDate`를 받아 `createdAt` 생성 기준으로 사용합니다.
- `@StepScope`가 있어야 `jobParameters`를 실행 시점에 안전하게 참조할 수 있습니다.

### 4-2. 실패를 재현하기 위한 테스트 Processor (옵션)

#### 왜 필요한지

restart를 이해하려면 "실패 시나리오"가 필요합니다.

#### 어떻게 구현하는지

특정 아이템에서 예외를 한 번 던져 실패를 유도합니다.

```java
@Bean
@StepScope
public ItemProcessor<ProductCsvRow, Product> productProcessor(
    @Value("#{jobParameters['baseDate']}") String baseDate,
    @Value("#{jobParameters['failOn']}") String failOn
) {
    LocalDate executionDate = LocalDate.parse(baseDate);

    return item -> {
        if (failOn != null && failOn.equalsIgnoreCase(item.name())) {
            throw new IllegalStateException("강제 실패 테스트: " + item.name());
        }
        return new Product(item.name().trim().toUpperCase(), item.price(), executionDate.atStartOfDay());
    };
}
```

이 코드의 역할:

- `failOn=mouse`처럼 주면 해당 아이템에서 Step이 실패합니다.

### 4-3. 실행 커맨드 정리

```bash
# 1) 정상 실행
./gradlew bootRun --args="--spring.batch.job.name=importProductJob baseDate=2026-04-11"

# 2) 같은 파라미터 재실행 (이미 완료면 충돌)
./gradlew bootRun --args="--spring.batch.job.name=importProductJob baseDate=2026-04-11"

# 3) 실패 유도 실행
./gradlew bootRun --args="--spring.batch.job.name=importProductJob baseDate=2026-04-12 failOn=mouse"

# 4) 실패 인스턴스 재시작(같은 파라미터, failOn 제거)
./gradlew bootRun --args="--spring.batch.job.name=importProductJob baseDate=2026-04-12"
```

이 코드의 역할:

- 완료 인스턴스 재실행과 실패 인스턴스 재시작의 차이를 직접 확인합니다.

### 여기서 기억할 점

- `@StepScope + jobParameters`는 거의 세트로 기억하면 편합니다.
- restart 학습은 반드시 "의도적 실패"를 한 번 만들어 보는 게 가장 빠릅니다.

---

## 5. 실행 결과 해석하기

### 무엇을 보는지

- Job 상태: `COMPLETED` / `FAILED`
- Step 실행 횟수
- 같은 `JOB_INSTANCE_ID`에서 실행이 이어지는지

```sql
SELECT ji.JOB_INSTANCE_ID,
       ji.JOB_NAME,
       je.JOB_EXECUTION_ID,
       je.STATUS,
       je.CREATE_TIME,
       je.START_TIME,
       je.END_TIME
FROM BATCH_JOB_INSTANCE ji
JOIN BATCH_JOB_EXECUTION je ON ji.JOB_INSTANCE_ID = je.JOB_INSTANCE_ID
ORDER BY je.JOB_EXECUTION_ID DESC;
```

이 코드의 역할:

- 인스턴스와 실행 이력을 한 번에 확인합니다.

### 실행하면 무엇이 되는지

- 실패 후 같은 파라미터 재실행 시 "새 인스턴스"가 아닌 같은 인스턴스 맥락에서 복구되는 흐름을 볼 수 있습니다.

### 여기서 기억할 점

- 운영 이슈 대응은 로그만으로 부족합니다. `BATCH_*` 메타테이블 조회 쿼리를 팀 공용으로 준비해두세요.

---

## 6. 실무에서 꼭 챙겨야 할 포인트

### 1) JobParameters 설계 원칙

- 식별용 파라미터: `baseDate`, `tenantId`, `jobNameSuffix`
- 비식별(운영 편의) 파라미터: 알림 여부, dry-run 여부

식별 파라미터가 흔들리면 재실행 정책이 꼬입니다.

### 2) 멱등성(idempotency) 확보

재시작 시 중복 입력이 나지 않도록 아래 중 하나를 갖추는 게 안전합니다.

- UPSERT 전략
- 유니크 키 + 중복 무시
- 처리 완료 플래그

### 3) chunk 크기와 restart 관계

chunk가 클수록 처리량은 좋아질 수 있지만,
실패 시 롤백 범위도 함께 커집니다.

### 4) 자주 하는 실수

- `@StepScope` 누락으로 `jobParameters` 주입 실패
- 파라미터 없이 계속 실행해 충돌 발생
- 실패 복구 시나리오를 테스트하지 않고 운영 반영

### 여기서 기억할 점

- "정상 시나리오 1번"보다 "실패 복구 시나리오 3번"이 실무에 더 중요합니다.

---

## 7. 마무리

이번 글에서는 Spring Batch의 핵심 난관인
`JobParameters`, `JobInstance`, `JobExecution`, restart를 실행 흐름으로 정리했습니다.

### 이번 글 요약

- 같은 Job의 재실행 충돌이 왜 생기는지 이해했다.
- 실패 실행을 재시작하는 기본 흐름을 확인했다.
- 운영을 위한 파라미터/멱등성/메타테이블 관점을 잡았다.

### 다음 글 예고 (3편)

다음 글에서는 대용량 배치에서 가장 중요한 성능 주제를 다룹니다.

1. chunk size를 어떻게 결정할지
2. Paging vs Cursor Reader 선택 기준
3. DB 부하를 줄이는 Writer 전략
4. 처리량/지연시간 측정 포인트

---

## 참고한 공식 문서 주제

- Spring Batch Reference Documentation
  - Domain Language of Batch (JobInstance, JobExecution, JobParameters)
  - Configuring and Running a Job
  - Restartability and Execution Metadata
  - Chunk-oriented Processing
- Spring Boot Reference Documentation
  - Running specific jobs and passing job parameters
  - Batch auto-configuration and data source initialization

---

## 태그 추천

`spring-batch`, `spring-boot`, `job-parameters`, `restart`, `job-instance`, `job-execution`, `chunk-processing`, `batch-tutorial`
