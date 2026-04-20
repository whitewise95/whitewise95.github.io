---
layout: post
title: "[스프링배치 4편] 스케줄링과 운영: 중복 실행 방지, 모니터링, 장애 대응"
date: 2026-04-15 09:00:00 +0900
categories: [스프링배치]
tags: [spring-batch, scheduling, operations, monitoring, alerting, job-operator]
permalink: /spring-batch/spring-batch-04-scheduling-and-operations/
---

## SEO 요약

Spring Batch를 실무에 올리면 코드보다 운영이 더 중요해집니다. 이 글에서는 스케줄링 방식 선택, 중복 실행 방지, 실행 이력 모니터링, 실패 알림과 재처리 플로우까지 운영 관점에서 필요한 핵심을 공식 문서 흐름에 맞춰 정리합니다. "배치가 돌아간다"를 넘어 "운영 가능한 배치"로 만드는 것이 목표입니다.

> 작성 시점의 공식 문서 기준: **Spring Boot 4.0.x**, **Spring Batch 6.0.x**

---

## 목차

1. 들어가며
2. 스케줄링 방식 선택하기
3. 중복 실행 방지 설계
4. 실행 이력 모니터링과 대시보드
5. 실패 알림과 재처리 운영 플로우
6. 운영 환경에서 꼭 필요한 설정
7. 실무 체크리스트
8. 마무리

---

## 1. 들어가며

### 왜 필요한지

개발 환경에서는 배치가 한 번 성공하면 끝처럼 보입니다.
운영에서는 아래 질문이 바로 나옵니다.

- 정해진 시간에 정확히 실행됐는가?
- 같은 배치가 겹쳐서 두 번 실행되지 않았는가?
- 실패하면 누가, 언제, 어떻게 복구할 것인가?

Spring Batch 공식 문서도 실행 메타데이터와 운영 관측을 중요하게 다룹니다.

### 이번 글에서 무엇을 할지

- 스케줄링 구조
- 중복 실행 방지
- 모니터링/알림
- 재처리 표준 플로우

이 4가지를 하나의 운영 관점으로 정리합니다.

### 여기서 기억할 점

- 운영 배치의 품질은 "성공률"보다 "실패 대응 속도"에서 갈립니다.

---

## 2. 스케줄링 방식 선택하기

### 왜 필요한지

스케줄링을 어디서 할지 먼저 정해야 운영 모델이 깔끔해집니다.

### 무엇을 하는지

실무에서 주로 아래 2가지를 씁니다.

1. 애플리케이션 내부 스케줄링 (`@Scheduled` + `JobLauncher`)
2. 외부 오케스트레이터(Cron, Argo, Jenkins, Airflow 등)에서 실행 트리거

### 어떻게 구현하는지

#### 2-1. 내부 스케줄링 예시

```java
@Component
@RequiredArgsConstructor
public class ProductBatchScheduler {

    private final JobLauncher jobLauncher;
    private final Job importProductJob;

    @Scheduled(cron = "0 0 2 * * *") // 매일 02:00
    public void run() throws Exception {
        JobParameters params = new JobParametersBuilder()
            .addString("baseDate", LocalDate.now().toString())
            .toJobParameters();

        jobLauncher.run(importProductJob, params);
    }
}
```

이 코드의 역할:

- 애플리케이션 내부에서 매일 2시에 배치를 실행합니다.

#### 2-2. 외부 트리거 예시

```bash
java -jar batch-app.jar --spring.batch.job.name=importProductJob baseDate=2026-04-15
```

이 코드의 역할:

- 스케줄은 외부 시스템이 담당하고, 앱은 배치 실행만 담당합니다.

### 실행하면 무엇이 되는지

- 내부 스케줄링: 빠르게 도입 가능
- 외부 오케스트레이션: 운영 표준화/재시도/관측 통합에 유리

### 여기서 기억할 점

- 작은 서비스는 내부 스케줄링으로 시작하고,
- 여러 배치를 운영하면 외부 오케스트레이터로 이동하는 게 일반적입니다.

---

## 3. 중복 실행 방지 설계

### 왜 필요한지

중복 실행은 데이터 중복/정합성 깨짐으로 바로 이어집니다.

### 무엇을 하는지

- 동일 JobParameters 중복 차단
- 실행 중 Job 재기동 차단
- 비즈니스 레벨 멱등성 확보

### 어떻게 구현하는지

#### 3-1. 실행 전 상태 확인 (JobExplorer)

```java
@Component
@RequiredArgsConstructor
public class BatchGuard {

    private final JobExplorer jobExplorer;

    public boolean isRunning(String jobName) {
        return !jobExplorer.findRunningJobExecutions(jobName).isEmpty();
    }
}
```

이 코드의 역할:

- 같은 Job이 현재 실행 중인지 확인합니다.

#### 3-2. 스케줄러에서 가드 적용

```java
if (batchGuard.isRunning("importProductJob")) {
    log.warn("importProductJob is already running. skip this trigger");
    return;
}
```

이 코드의 역할:

- 겹치는 트리거가 들어와도 중복 실행을 방지합니다.

### 실행하면 무엇이 되는지

- 스케줄 지연/중복 트리거 상황에서도 안전하게 한 번만 실행됩니다.

### 여기서 기억할 점

- 중복 실행 방지는 애플리케이션 가드 + 멱등한 데이터 처리(UPSERT/유니크키)를 같이 가져가야 안전합니다.

---

## 4. 실행 이력 모니터링과 대시보드

### 왜 필요한지

배치가 실패했는지 모르는 상태가 가장 위험합니다.

### 무엇을 하는지

Batch 메타테이블을 기반으로 운영 대시보드를 만듭니다.

### 어떻게 구현하는지

```sql
SELECT ji.JOB_NAME,
       je.JOB_EXECUTION_ID,
       je.STATUS,
       je.START_TIME,
       je.END_TIME,
       TIMESTAMPDIFF(SECOND, je.START_TIME, je.END_TIME) AS duration_sec
FROM BATCH_JOB_EXECUTION je
JOIN BATCH_JOB_INSTANCE ji ON ji.JOB_INSTANCE_ID = je.JOB_INSTANCE_ID
ORDER BY je.JOB_EXECUTION_ID DESC
LIMIT 50;
```

이 코드의 역할:

- 최근 실행 이력과 소요 시간을 한 번에 확인합니다.

```sql
SELECT STEP_NAME,
       READ_COUNT,
       WRITE_COUNT,
       COMMIT_COUNT,
       ROLLBACK_COUNT,
       STATUS
FROM BATCH_STEP_EXECUTION
ORDER BY STEP_EXECUTION_ID DESC
LIMIT 50;
```

이 코드의 역할:

- Step 단위 처리량/롤백 지표를 확인합니다.

### 실행하면 무엇이 되는지

- 실패율, 평균 소요시간, 처리량 추이를 대시보드로 시각화할 수 있습니다.

### 여기서 기억할 점

- 운영에서 가장 먼저 보는 화면은 "최근 실패 Job + 마지막 성공 시각"입니다.

---

## 5. 실패 알림과 재처리 운영 플로우

### 왜 필요한지

실패 자체보다 실패를 늦게 아는 게 더 치명적입니다.

### 무엇을 하는지

- 실패 즉시 알림
- 원인 확인
- 재실행/재시작 기준 분리

### 어떻게 구현하는지

#### 5-1. JobExecutionListener로 알림 연결

```java
@Component
public class BatchAlertListener implements JobExecutionListener {

    @Override
    public void afterJob(JobExecution jobExecution) {
        if (jobExecution.getStatus() == BatchStatus.FAILED) {
            // Slack/Email/Webhook 발송
            // sendAlert(jobExecution.getJobInstance().getJobName(), jobExecution.getExitStatus().getExitDescription());
        }
    }
}
```

이 코드의 역할:

- Job 실패 시점에 알림 채널로 즉시 통지합니다.

#### 5-2. 재처리 기준

- 같은 파라미터 + 실패 상태: `restart` 후보
- 데이터 자체 수정 후 다시 처리: 새 파라미터로 `rerun`

### 실행하면 무엇이 되는지

- "실패 감지 -> 원인 확인 -> 복구 실행"이 일관된 운영 절차로 정착됩니다.

### 여기서 기억할 점

- 재시작(restart)과 재실행(rerun)을 구분하지 않으면 사고가 납니다.

---

## 6. 운영 환경에서 꼭 필요한 설정

### 왜 필요한지

개발 환경 기본값 그대로 운영하면 곧 문제를 만납니다.

### 무엇을 하는지

- 메타데이터 테이블 보존 정책
- 로그 레벨/보관
- 타임존/파라미터 표준

### 어떻게 구현하는지

```yaml
spring:
  batch:
    jdbc:
      initialize-schema: never

logging:
  level:
    org.springframework.batch.core: INFO
    org.springframework.jdbc.core: WARN
```

이 코드의 역할:

- 운영에서 메타데이터 스키마를 매번 재초기화하지 않도록 설정합니다.
- 과도한 SQL 로그를 줄여 필요한 로그만 남깁니다.

### 실행하면 무엇이 되는지

- 운영 데이터 보존이 안정화되고, 로그 노이즈가 줄어 장애 분석이 쉬워집니다.

### 여기서 기억할 점

- 운영/개발 프로파일은 반드시 분리하세요.

---

## 7. 실무 체크리스트

1. 스케줄 주기와 SLA(완료 마감 시각)가 명시돼 있는가
2. 중복 실행 방지 가드가 있는가
3. 실패 알림이 즉시 전송되는가
4. restart/rerun 기준이 문서화돼 있는가
5. 메타테이블 대시보드가 있는가
6. 멱등성(중복 방지)이 DB 레벨까지 보장되는가
7. 운영 프로파일 설정이 분리돼 있는가

### 여기서 기억할 점

- 체크리스트가 없으면 운영은 개인 역량에 의존하게 됩니다.

---

## 8. 마무리

이번 글에서는 "배치 실행 코드"가 아니라
"배치를 서비스로 운영하는 방법"에 집중했습니다.

### 이번 글 요약

- 스케줄링 구조를 선택하고,
- 중복 실행을 차단하고,
- 실행 이력과 실패 알림을 체계화해야,
- 운영 가능한 배치가 됩니다.

### 다음 글 예고 (5편)

마지막 5편에서는 실무 고급 패턴을 정리합니다.

1. 멀티 Step Job과 조건 분기
2. 파티셔닝/병렬 처리
3. 배치 테스트 전략(`spring-batch-test`)
4. 운영 배치 리팩토링 체크포인트

---

## 참고한 공식 문서 주제

- Spring Batch Reference Documentation
  - Configuring and Running a Job
  - JobOperator / JobExplorer / JobRepository
  - Monitoring and Execution Metadata
  - Restartability
- Spring Boot Reference Documentation
  - Scheduling and batch execution
  - Batch auto-configuration and profile-based settings

---

## 태그 추천

`spring-batch`, `batch-operations`, `batch-monitoring`, `batch-scheduling`, `job-explorer`, `job-operator`, `batch-restart`
