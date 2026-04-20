---
layout: post
title: "[스프링배치 3편] 대용량 성능 튜닝: chunk 크기, Paging vs Cursor Reader 선택법"
date: 2026-04-13 09:30:00 +0900
categories: [스프링배치]
tags: [spring-batch, performance, chunk, jdbc-paging-item-reader, jdbc-cursor-item-reader, batch-tuning]
permalink: /spring-batch/spring-batch-03-performance-chunk-paging-cursor/
---

## SEO 요약

Spring Batch 성능은 코드 몇 줄보다 `chunk size`, Reader 선택(Paging/Cursor), Writer 전략에서 갈립니다. 이 글에서는 CSV -> DB 예제를 확장해 대용량 처리 시 어떤 기준으로 튜닝해야 하는지, 공식 문서 흐름에 맞춰 실행 가능한 예제와 함께 정리합니다. 입문자가 실무로 넘어갈 때 가장 먼저 부딪히는 병목 포인트를 한 번에 잡는 것이 목표입니다.

> 작성 시점의 공식 문서 기준: **Spring Boot 4.0.x**, **Spring Batch 6.0.x**

---

## 목차

1. 들어가며
2. 성능 튜닝에서 chunk가 가장 먼저인 이유
3. chunk size 결정하기
4. Paging Reader vs Cursor Reader 선택 기준
5. Writer 구간 튜닝 포인트
6. 성능 측정과 검증 방법
7. 실무에서 자주 터지는 문제와 예방 팁
8. 마무리

---

## 1. 들어가며

### 왜 필요한지

배치가 느릴 때 많은 분들이 먼저 코드 최적화를 떠올립니다.
하지만 실제로는 아래 3가지를 먼저 잡는 편이 효과가 큽니다.

- chunk 크기
- Reader 전략(Paging/Cursor)
- Writer 트랜잭션/배치 쓰기 방식

Spring Batch 공식 문서도 chunk 기반 처리와 Reader 특성을 중심으로 설명합니다.

### 무엇을 할지

이번 글에서는 DB에서 대량 데이터를 읽어 가공 후 저장하는 시나리오로,
성능 튜닝의 핵심 선택지를 비교합니다.

### 여기서 기억할 점

- 성능 튜닝은 "느린 코드 찾기"보다 "올바른 처리 전략 선택"이 먼저입니다.

---

## 2. 성능 튜닝에서 chunk가 가장 먼저인 이유

### 왜 필요한지

chunk는 트랜잭션 경계를 결정합니다.
그래서 성능과 안정성(실패 시 롤백 범위)에 동시에 영향을 줍니다.

### 무엇을 하는지

`chunk(100)`이면 아래가 한 묶음으로 실행됩니다.

1. 100건 `read`
2. 100건 `process`
3. 100건 `write`
4. commit

### 어떻게 구현하는지

```java
@Bean
public Step migrateProductStep(
    JobRepository jobRepository,
    PlatformTransactionManager transactionManager,
    ItemReader<SourceProduct> reader,
    ItemProcessor<SourceProduct, TargetProduct> processor,
    ItemWriter<TargetProduct> writer
) {
    return new StepBuilder("migrateProductStep", jobRepository)
        .<SourceProduct, TargetProduct>chunk(500, transactionManager)
        .reader(reader)
        .processor(processor)
        .writer(writer)
        .build();
}
```

이 코드의 역할:

- `500`건 단위로 트랜잭션을 커밋합니다.

### 실행하면 무엇이 되는지

- chunk가 너무 작으면 commit 횟수가 많아져 오버헤드 증가
- chunk가 너무 크면 메모리 사용/락 점유 시간이 증가

### 여기서 기억할 점

- chunk는 "성능 스위치"이자 "안정성 스위치"입니다.

---

## 3. chunk size 결정하기

### 왜 필요한지

정답 숫자는 없습니다. 데이터 특성과 DB 특성에 따라 달라집니다.

### 무엇을 하는지

일반적으로 아래 순서로 실험합니다.

- 100 -> 500 -> 1000 순서로 증가
- 처리량(rows/sec), 평균 지연, 에러율 비교

### 어떻게 구현하는지

`JobParameters`로 chunk를 받아 실험하면 편합니다.

```java
@Bean
@StepScope
public Step migrateProductStep(
    JobRepository jobRepository,
    PlatformTransactionManager transactionManager,
    ItemReader<SourceProduct> reader,
    ItemProcessor<SourceProduct, TargetProduct> processor,
    ItemWriter<TargetProduct> writer,
    @Value("#{jobParameters['chunkSize']}") Integer chunkSize
) {
    int size = (chunkSize == null) ? 500 : chunkSize;

    return new StepBuilder("migrateProductStep", jobRepository)
        .<SourceProduct, TargetProduct>chunk(size, transactionManager)
        .reader(reader)
        .processor(processor)
        .writer(writer)
        .build();
}
```

이 코드의 역할:

- 실행 시점에 chunk 크기를 바꿔가며 벤치마크할 수 있게 만듭니다.

### 실행하면 무엇이 되는지

```bash
./gradlew bootRun --args="--spring.batch.job.name=migrateProductJob chunkSize=100"
./gradlew bootRun --args="--spring.batch.job.name=migrateProductJob chunkSize=500"
./gradlew bootRun --args="--spring.batch.job.name=migrateProductJob chunkSize=1000"
```

이 코드의 역할:

- 동일 배치를 다른 chunk 조건으로 반복 실행해 비교합니다.

### 여기서 기억할 점

- "처리량 최대"만 보면 안 됩니다.
- 장애 시 재처리 비용(롤백 범위)까지 같이 봐야 실무 최적값입니다.

---

## 4. Paging Reader vs Cursor Reader 선택 기준

Spring Batch 공식 문서에서 DB Reader는 크게 Cursor와 Paging으로 설명됩니다.

## 4-1. Cursor Reader

### 왜 필요한지

큰 결과셋을 "한 줄씩 스트리밍"처럼 읽고 싶을 때 유리합니다.

### 어떻게 구현하는지

```java
@Bean
public JdbcCursorItemReader<SourceProduct> cursorReader(DataSource dataSource) {
    JdbcCursorItemReader<SourceProduct> reader = new JdbcCursorItemReader<>();
    reader.setDataSource(dataSource);
    reader.setSql("SELECT id, name, price, updated_at FROM source_product ORDER BY id");
    reader.setFetchSize(1000);
    reader.setRowMapper((rs, rowNum) -> new SourceProduct(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getInt("price"),
        rs.getTimestamp("updated_at").toLocalDateTime()
    ));
    return reader;
}
```

이 코드의 역할:

- 커서를 열고 한 행씩 읽습니다.
- `fetchSize`로 DB 드라이버의 가져오기 단위를 조절합니다.

### 실행하면 무엇이 되는지

- 메모리 폭증 없이 대량 처리 가능
- 단일 긴 쿼리/커넥션 유지 특성이 있어 DB/드라이버 특성 영향을 받음

## 4-2. Paging Reader

### 왜 필요한지

페이지 단위로 쿼리를 나눠 읽고 싶을 때 유리합니다.

### 어떻게 구현하는지

```java
@Bean
public JdbcPagingItemReader<SourceProduct> pagingReader(DataSource dataSource) throws Exception {
    SqlPagingQueryProviderFactoryBean provider = new SqlPagingQueryProviderFactoryBean();
    provider.setDataSource(dataSource);
    provider.setSelectClause("SELECT id, name, price, updated_at");
    provider.setFromClause("FROM source_product");
    provider.setSortKey("id");

    JdbcPagingItemReader<SourceProduct> reader = new JdbcPagingItemReader<>();
    reader.setName("pagingReader");
    reader.setDataSource(dataSource);
    reader.setPageSize(1000);
    reader.setQueryProvider(provider.getObject());
    reader.setRowMapper((rs, rowNum) -> new SourceProduct(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getInt("price"),
        rs.getTimestamp("updated_at").toLocalDateTime()
    ));
    return reader;
}
```

이 코드의 역할:

- 페이지 쿼리로 나눠서 읽습니다.
- `sortKey`는 반드시 고유/안정적인 키를 쓰는 것이 안전합니다.

### 실행하면 무엇이 되는지

- 페이지 단위라 운영 중 관찰/재시도 전략과 맞추기 쉬움
- 페이지 경계에서 데이터 변동(삽입/삭제) 영향을 받을 수 있어 정렬 키 설계가 중요

## 4-3. 선택 기준 한 번에 정리

| 기준 | Cursor | Paging |
|---|---|---|
| 읽기 방식 | 커서 스트리밍 | 페이지 쿼리 반복 |
| 메모리 관점 | 유리 | pageSize에 비례 |
| DB 부하 패턴 | 긴 커넥션/긴 조회 | 짧은 쿼리 반복 |
| 데이터 변동 대응 | 상대적으로 안정 | 정렬/경계 설계 중요 |
| 추천 상황 | 고정 데이터 대량 읽기 | 운영 관찰/분할 처리 중심 |

### 여기서 기억할 점

- "무조건 Paging" 혹은 "무조건 Cursor"는 없습니다.
- 데이터 변경 빈도, DB 부하 특성, 운영 방식으로 선택하세요.

---

## 5. Writer 구간 튜닝 포인트

### 왜 필요한지

대량 배치의 병목은 Reader보다 Writer에서 더 자주 발생합니다.

### 무엇을 하는지

- JDBC batch insert 사용
- 인덱스/제약조건 비용 점검
- 트랜잭션 크기(chunk)와 함께 조정

### 어떻게 구현하는지

```java
@Bean
public JdbcBatchItemWriter<TargetProduct> productWriter(DataSource dataSource) {
    return new JdbcBatchItemWriterBuilder<TargetProduct>()
        .dataSource(dataSource)
        .sql("""
             INSERT INTO target_product (id, name, price, migrated_at)
             VALUES (:id, :name, :price, :migratedAt)
             """)
        .beanMapped()
        .assertUpdates(false)
        .build();
}
```

이 코드의 역할:

- Writer가 JDBC batch 방식으로 묶어서 insert 하도록 구성합니다.

### 실행하면 무엇이 되는지

- 단건 insert 반복보다 네트워크/DB round-trip 감소
- 인덱스가 과도하면 여전히 느릴 수 있으므로 DB 측 점검 필수

### 여기서 기억할 점

- Writer 성능은 애플리케이션 코드 + DB 인덱스/락 전략을 함께 봐야 합니다.

---

## 6. 성능 측정과 검증 방법

### 왜 필요한지

튜닝은 "체감"이 아니라 숫자로 판단해야 합니다.

### 무엇을 하는지

아래 4개 지표를 최소로 수집합니다.

- 처리량(rows/sec)
- 총 실행 시간
- 에러/스킵 건수
- DB CPU/락 대기 시간

### 어떻게 구현하는지

StepExecution에서 기본 카운터를 확인합니다.

```sql
SELECT STEP_NAME,
       READ_COUNT,
       WRITE_COUNT,
       COMMIT_COUNT,
       ROLLBACK_COUNT,
       START_TIME,
       END_TIME,
       STATUS
FROM BATCH_STEP_EXECUTION
ORDER BY STEP_EXECUTION_ID DESC;
```

이 코드의 역할:

- 배치 처리량과 안정성 지표를 메타테이블에서 바로 확인합니다.

### 실행하면 무엇이 되는지

- "chunk 500이 정말 빠른가"를 객관적으로 비교 가능
- 실패/롤백이 늘었는지도 함께 판단 가능

### 여기서 기억할 점

- 처리량만 좋아지고 롤백/락이 급증하면 실무에서는 실패한 튜닝입니다.

---

## 7. 실무에서 자주 터지는 문제와 예방 팁

### 1) 정렬 키 없는 Paging

- 문제: 중복/누락 발생 가능
- 예방: 고유하고 불변에 가까운 키(`id`)로 정렬

### 2) chunk 과대 설정

- 문제: OOM/긴 락/대형 롤백
- 예방: 단계적으로 증가시키며 지표 확인

### 3) Reader-Writer 밸런스 붕괴

- 문제: 읽기는 빠른데 쓰기에서 대기
- 예방: Writer SQL/인덱스/DB 파라미터 동시 점검

### 4) 측정 없이 튜닝

- 문제: "빨라진 것 같은" 착시
- 예방: StepExecution + DB 모니터링 숫자 비교 필수

### 여기서 기억할 점

- 배치 성능 문제는 코드 50%, DB/운영 50%입니다.

---

## 8. 마무리

이번 글에서는 대용량 배치 튜닝의 핵심 3가지를 정리했습니다.

- chunk 크기
- Paging vs Cursor Reader 선택
- Writer/측정 전략

### 이번 글 요약

- chunk는 성능과 복구 범위를 동시에 결정한다.
- Reader 선택은 데이터 변경 패턴/운영 방식까지 고려해야 한다.
- 튜닝 결과는 `BATCH_STEP_EXECUTION`과 DB 지표로 검증해야 한다.

### 다음 글 예고 (4편)

다음 글에서는 운영 관점으로 넘어갑니다.

1. 스케줄링과 배포 방식
2. 장애 알림/재처리 운영 플로우
3. 실행 이력 대시보드화
4. 운영 배치에서의 안전장치(락, 중복 실행 방지)

---

## 참고한 공식 문서 주제

- Spring Batch Reference Documentation
  - Chunk-oriented Processing
  - Database ItemReaders (Cursor vs Paging)
  - JdbcCursorItemReader / JdbcPagingItemReader
  - Step/Execution metadata
- Spring Boot Reference Documentation
  - Batch auto-configuration
  - DataSource/SQL initialization and external configuration

---

## 태그 추천

`spring-batch`, `batch-performance`, `chunk-processing`, `jdbc-paging-item-reader`, `jdbc-cursor-item-reader`, `batch-tuning`, `spring-boot`
