---
layout: post
title: "[스프링배치 1편] Spring Batch 입문: CSV를 읽어 DB에 저장하는 첫 배치 만들기"
date: 2026-04-09 20:30:00 +0900
categories: [스프링배치]
tags: [spring-batch, spring-boot, batch, csv, h2, jdbc, tutorial]
permalink: /spring-batch/spring-batch-01-getting-started-csv-to-db/
---

## 제목 후보

1. `Spring Batch 입문 1편: CSV를 읽어 DB에 저장하는 첫 배치 만들기`
2. `Spring Batch 처음 시작하기: 공식 문서 기준으로 만드는 CSV -> DB 배치`
3. `실전으로 배우는 Spring Batch: 프로젝트 생성부터 첫 Job 실행까지`

## SEO 요약

Spring Batch를 처음 시작하는 분을 위해, Spring Boot 프로젝트 생성부터 CSV 파일을 읽어 DB에 저장하는 배치를 직접 만들어봅니다. 공식 문서 기준으로 Job/Step, Reader/Processor/Writer, JobParameters, chunk 처리까지 한 번에 이해할 수 있게 구성했습니다. 이 글 한 편으로 "첫 배치 실행 성공"까지 도달하는 것이 목표입니다.

> 작성 시점의 공식 문서 기준: **Spring Boot 4.0.x**, **Spring Batch 6.0.x**

---

## 목차

1. 들어가며
2. Spring Batch 핵심 개념 빠르게 이해하기
3. 프로젝트 생성과 기본 설정
4. 예제 데이터 준비
5. 첫 번째 배치 만들기
6. 배치 실행해보기
7. Spring Batch를 쓰면서 꼭 알아야 할 것
8. 마무리

---

## 1. 들어가며

### 왜 Spring Batch가 필요한가

배치 작업은 보통 이런 문제를 다룹니다.

- 매일 정해진 시각에 대량 데이터를 처리해야 한다.
- 중간 실패가 나도 "어디까지 처리했는지" 추적하고 다시 시작해야 한다.
- 처리 결과와 이력을 남겨 운영에서 확인해야 한다.

공식 문서에서도 Spring Batch를 단순 스케줄러가 아니라,
**대량 데이터 처리 + 안정적인 재실행/복구 + 처리 이력 관리**를 위한 프레임워크로 설명합니다.

### 어떤 상황에서 쓰는가

- 정산/집계, 로그 가공, CSV/엑셀 import
- 외부 시스템 동기화
- 데이터 마이그레이션

### 이번 글에서 만들 예제

`products.csv`를 읽어서:

1. 이름/가격 데이터 가공(Processor)
2. `product` 테이블에 저장(Writer)
3. 한 번의 Job으로 끝까지 실행

### 여기서 기억할 점

- 오늘 목표는 "개념 완벽 이해"가 아니라 **첫 배치 실행 성공**입니다.
- 실행 성공 후 개념을 다시 보면 훨씬 빨리 이해됩니다.

---

## 2. Spring Batch 핵심 개념 빠르게 이해하기

이 섹션은 반드시 잡고 가야 할 용어만 입문자 관점으로 정리합니다.

### Job / Step

- `Job`: 배치 작업 전체(예: 상품 CSV 적재 작업)
- `Step`: Job 안의 실행 단위(예: 읽기-가공-저장)

즉, **Job은 큰 작업**, **Step은 그 안의 단계**입니다.

### Reader / Processor / Writer

- `ItemReader`: 데이터를 읽음 (CSV 한 줄씩)
- `ItemProcessor`: 읽은 데이터를 가공/검증
- `ItemWriter`: 가공된 데이터를 저장(DB)

### JobParameters / JobInstance / JobExecution

- `JobParameters`: 실행 시 넘기는 파라미터(예: 실행일자, 입력파일 경로)
- `JobInstance`: "같은 Job + 같은 JobParameters" 조합
- `JobExecution`: 실제 실행 한 번 (성공/실패 상태 포함)

실무에서 중요한 이유:

- 파라미터가 바뀌면 "다른 실행"으로 인식
- 실패한 실행을 재시작/재실행할 때 기준이 됨

### JobRepository

Spring Batch가 내부적으로 사용하는 메타데이터 저장소입니다.

- 어떤 Job이 언제 시작/종료됐는지
- 성공/실패 상태
- 재시작 가능 여부

이 정보가 있어야 운영이 됩니다.

### chunk processing

한 건씩 바로 DB에 쓰지 않고, **묶음(chunk)** 단위로 처리합니다.

예를 들어 `chunkSize=100`이면:

1. 100건 읽고
2. 100건 가공하고
3. 100건을 한 트랜잭션으로 저장

장점:

- 성능 향상
- 실패 시 어느 단위까지 처리됐는지 관리 용이

### 여기서 기억할 점

- Spring Batch 핵심은 `Job/Step + Reader/Processor/Writer + JobRepository + chunk` 조합입니다.
- 이 네 가지가 이해되면 나머지는 확장입니다.

---

## 3. 프로젝트 생성과 기본 설정

### 왜 필요한가

배치는 일반 웹 API와 다르게, 실행 이력/재시작 정보를 저장하는 기반 설정이 중요합니다.

### 무엇을 하는가

- Spring Boot 프로젝트 생성
- Batch/JDBC/H2 의존성 추가
- Batch 메타데이터 테이블 자동 생성 설정

### 3-1. 의존성 설정

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.0.3'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'io.whitewise'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-batch'
    implementation 'org.springframework.boot:spring-boot-starter-jdbc'
    runtimeOnly 'com.h2database:h2'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.batch:spring-batch-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

이 코드의 역할:

- Batch 실행 엔진 + JDBC Writer + H2 DB 테스트 환경을 구성합니다.

### 3-2. `application.yml` 설정

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:batchdb;MODE=MySQL;DB_CLOSE_DELAY=-1
    driver-class-name: org.h2.Driver
    username: sa
    password:

  h2:
    console:
      enabled: true

  batch:
    jdbc:
      initialize-schema: always
    job:
      enabled: true

logging:
  level:
    org.springframework.batch: INFO
```

이 코드의 역할:

- 인메모리 H2 DB를 사용하고,
- Spring Batch 메타데이터 테이블(`BATCH_JOB_*`)을 자동 생성합니다.

### 3-3. 메타데이터 테이블은 왜 필요한가

공식 문서 기준으로 Batch는 `JobRepository`를 통해 실행 이력을 저장합니다.
그래서 아래 같은 테이블이 자동 생성됩니다.

- `BATCH_JOB_INSTANCE`
- `BATCH_JOB_EXECUTION`
- `BATCH_STEP_EXECUTION`

운영에서 "어제 배치 왜 실패했는지"를 보는 핵심 근거입니다.

### 여기서 기억할 점

- Batch 프로젝트는 비즈니스 테이블 + 메타데이터 테이블이 함께 필요합니다.
- 메타데이터 테이블이 있어야 재실행/재시작이 가능합니다.

---

## 4. 예제 데이터 준비

### 왜 필요한가

입문 단계에서는 "읽을 데이터"와 "저장할 테이블"이 명확해야 흐름이 보입니다.

### 무엇을 하는가

- CSV 샘플 파일 생성
- 저장 대상 테이블 생성

### 4-1. CSV 파일 (`src/main/resources/input/products.csv`)

```csv
name,price
keyboard,30000
mouse,15000
monitor,250000
```

이 코드의 역할:

- Reader가 읽을 입력 데이터입니다. 첫 줄은 헤더입니다.

### 4-2. 저장 테이블 (`src/main/resources/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS product (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price INT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

이 코드의 역할:

- Writer가 최종 저장할 비즈니스 테이블을 만듭니다.

### 4-3. 예제 시나리오

- Reader: CSV 한 줄 -> `ProductCsvRow`
- Processor: 이름 대문자 변환 + `createdAt` 추가
- Writer: `product` 테이블 insert

### 여기서 기억할 점

- 입문에서는 데이터 흐름을 단순하게 유지하는 게 가장 중요합니다.
- 복잡한 검증/예외 처리는 다음 편에서 확장해도 늦지 않습니다.

---

## 5. 첫 번째 배치 만들기

### 왜 필요한가

이제 실제로 Spring Batch 구성요소를 코드로 연결합니다.

### 무엇을 하는가

- Reader/Processor/Writer 구현
- Job/Step 조립

### 5-1. 도메인 클래스

```java
package io.whitewise.batch;

public record ProductCsvRow(String name, Integer price) {
}
```

이 코드의 역할:

- CSV 한 줄을 담는 입력 모델입니다.

```java
package io.whitewise.batch;

import java.time.LocalDateTime;

public record Product(String name, Integer price, LocalDateTime createdAt) {
}
```

이 코드의 역할:

- Processor 이후 DB에 저장할 최종 모델입니다.

### 5-2. Reader

```java
package io.whitewise.batch;

import org.springframework.batch.item.file.FlatFileItemReader;
import org.springframework.batch.item.file.builder.FlatFileItemReaderBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class ProductReaderConfig {

    @Bean
    public FlatFileItemReader<ProductCsvRow> productReader() {
        return new FlatFileItemReaderBuilder<ProductCsvRow>()
            .name("productReader")
            .resource(new ClassPathResource("input/products.csv"))
            .delimited()
            .names("name", "price")
            .linesToSkip(1)
            .targetType(ProductCsvRow.class)
            .build();
    }
}
```

이 코드의 역할:

- `products.csv`를 한 줄씩 읽어 `ProductCsvRow`로 변환합니다.

### 5-3. Processor

```java
package io.whitewise.batch;

import java.time.LocalDateTime;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductProcessorConfig {

    @Bean
    public ItemProcessor<ProductCsvRow, Product> productProcessor() {
        return item -> new Product(
            item.name().trim().toUpperCase(),
            item.price(),
            LocalDateTime.now()
        );
    }
}
```

이 코드의 역할:

- 이름을 정규화하고(`toUpperCase`), 생성 시각을 채웁니다.

### 5-4. Writer

```java
package io.whitewise.batch;

import javax.sql.DataSource;
import org.springframework.batch.item.database.JdbcBatchItemWriter;
import org.springframework.batch.item.database.builder.JdbcBatchItemWriterBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductWriterConfig {

    @Bean
    public JdbcBatchItemWriter<Product> productWriter(DataSource dataSource) {
        return new JdbcBatchItemWriterBuilder<Product>()
            .dataSource(dataSource)
            .sql("""
                INSERT INTO product(name, price, created_at)
                VALUES (:name, :price, :createdAt)
                """)
            .beanMapped()
            .build();
    }
}
```

이 코드의 역할:

- 가공된 `Product`를 DB에 배치 insert 합니다.

### 5-5. Job / Step 설정

```java
package io.whitewise.batch;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.ItemWriter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class ProductBatchJobConfig {

    @Bean
    public Step importProductStep(
        JobRepository jobRepository,
        PlatformTransactionManager transactionManager,
        ItemReader<ProductCsvRow> productReader,
        ItemProcessor<ProductCsvRow, Product> productProcessor,
        ItemWriter<Product> productWriter
    ) {
        return new StepBuilder("importProductStep", jobRepository)
            .<ProductCsvRow, Product>chunk(2, transactionManager)
            .reader(productReader)
            .processor(productProcessor)
            .writer(productWriter)
            .build();
    }

    @Bean
    public Job importProductJob(JobRepository jobRepository, Step importProductStep) {
        return new JobBuilder("importProductJob", jobRepository)
            .start(importProductStep)
            .build();
    }
}
```

이 코드의 역할:

- 하나의 Step(읽기-가공-저장)을 Job으로 구성합니다.
- `chunk(2)`라서 2건씩 트랜잭션 처리됩니다.

### 여기서 기억할 점

- Reader/Processor/Writer는 역할 분리가 핵심입니다.
- Step은 "처리 방식(chunk)"을 결정하고, Job은 "실행 흐름"을 결정합니다.

---

## 6. 배치 실행해보기

### 왜 필요한가

배치는 "코드 작성"보다 "실행 결과 해석"이 더 중요합니다.

### 무엇을 하는가

- 앱 실행
- DB 결과 확인
- Batch 메타데이터 확인

### 6-1. 실행 방법

```bash
./gradlew bootRun
```

이 코드의 역할:

- 애플리케이션 시작 시 `importProductJob`이 자동 실행됩니다.

### 6-2. 결과 확인 (H2 콘솔)

```sql
SELECT * FROM product;
```

이 코드의 역할:

- CSV 데이터가 가공되어 저장되었는지 확인합니다.

```sql
SELECT JOB_NAME, STATUS, START_TIME, END_TIME
FROM BATCH_JOB_EXECUTION
ORDER BY JOB_EXECUTION_ID DESC;
```

이 코드의 역할:

- 배치 실행 성공/실패 이력을 확인합니다.

### 6-3. 로그에서 볼 포인트

- Job 이름: `importProductJob`
- Step 이름: `importProductStep`
- 읽은 건수 / 쓴 건수
- 최종 상태: `COMPLETED`

### 여기서 기억할 점

- `product` 테이블만 보지 말고 `BATCH_*` 테이블까지 같이 봐야 Batch를 제대로 이해할 수 있습니다.

---

## 7. Spring Batch를 쓰면서 꼭 알아야 할 것

### 재실행/재시작 개념

- 같은 JobParameters로 동일 Job을 다시 실행하면 충돌할 수 있습니다.
- 실패 실행은 재시작 가능한 구조인지 확인해야 합니다.

### JobParameters가 왜 중요한가

공식 문서 기준으로 Job 식별의 핵심은 `Job + JobParameters`입니다.
운영 배치에서는 보통 실행일자(`baseDate`)를 파라미터로 둡니다.

### chunk size를 왜 조절하는가

- 너무 작으면 트랜잭션 오버헤드 증가
- 너무 크면 메모리 사용량/락 시간 증가

보통은 데이터 특성에 맞춰 100, 500, 1000 등으로 벤치마크합니다.

### 실무에서 자주 겪는 실수

- Reader는 동작하지만 Writer SQL 매핑이 틀린 경우
- JobParameters 없이 재실행하다가 이미 완료된 인스턴스 충돌
- 메타데이터 테이블 초기화 설정 누락

### 여기서 기억할 점

- "한 번 실행 성공" 다음에는 반드시 "재실행 시나리오"를 테스트해야 합니다.

---

## 8. 마무리

이번 글에서는 Spring Batch 입문자가 처음으로 부딪히는 핵심을
"프로젝트 생성 -> 개념 -> CSV -> DB 실행" 순서로 정리했습니다.

### 이번 글 요약

- Spring Batch의 핵심 구성요소(Job/Step/Reader/Processor/Writer)를 연결했다.
- chunk 기반 처리와 JobRepository의 의미를 실행 결과로 확인했다.
- 공식 문서 기반으로 첫 배치 성공 경험을 만들었다.

### 다음 글에서 다루면 좋은 심화 주제

1. `JobParameters`를 사용한 날짜별 실행 분리
2. 실패 지점부터 재시작(`restart`)하기
3. FlatFileItemReader 에러 라인 건너뛰기(skip/retry)
4. 다중 Step Job과 조건 분기(flow)
5. 배치 테스트(`spring-batch-test`) 작성법

---

## 참고한 공식 문서 주제

- Spring Batch Reference Documentation
  - Core Concepts (Job, Step, JobRepository)
  - ItemReader / ItemProcessor / ItemWriter
  - Chunk-oriented Processing
  - Configuring and Running a Job
- Spring Boot Reference Documentation
  - Batch Auto-configuration
  - DataSource / SQL Initialization
  - Externalized Configuration (`application.yml`)

---

## 태그 추천

`spring-batch`, `spring-boot`, `batch`, `csv`, `jdbc`, `h2`, `job-parameters`, `chunk-processing`
