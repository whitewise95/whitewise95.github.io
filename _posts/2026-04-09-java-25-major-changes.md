---
layout: post
title: "Java 25 주요 변경사항"
date: 2026-04-09 00:00:00 +0900 00:00:00 +0900
categories: [Java]
tags: [java, java-25]
permalink: /java/java-25-major-changes/
---

## 개요

Java 25는 **2025년 9월 16일**에 공개된 기능 릴리스입니다.
이번 버전은 동시성(Structured Concurrency/Scoped Values), 관측성(JFR),
런타임 최적화(AOT/JFR/GC) 관련 변경이 크게 포함되었습니다.

이 글은 Java 25의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 24)과 차이점

## 1) 출시년도

| 항목 | 내용 |
| --- | --- |
| 버전 | Java 25 |
| 출시일 | 2025-09-16 |
| 릴리스 성격 | 기능 릴리스 (여러 배포판에서 장기 지원 대상으로 취급) |

## 2) 주요 변경사항 요약

| 변경사항 | 상태 | 실무 영향 |
| ---- | --- | ----- |
| Structured Concurrency | Fifth Preview | 요청 단위 병렬 처리/취소 정책 정교화 |
| Scoped Values | Final | 컨텍스트 전달 모델을 안정적으로 사용 가능 |
| Module Import Declarations | Final | 모듈 import 문법 간소화 |
| Flexible Constructor Bodies | Final | 생성자 초기화 코드 표현력 향상 |
| Compact Source Files and Instance Main Methods | Final | 학습/스크립트 코드 진입장벽 완화 |
| Stable Values | Preview | 값 안정성 기반 최적화 실험 |
| Primitive Types in Patterns | Third Preview | 패턴 매칭 표현력 확장 지속 |
| JFR CPU-Time Profiling / Method Timing & Tracing / Cooperative Sampling | Experimental/Feature | 성능 분석 정밀도 개선 |
| Generational Shenandoah | Feature | GC 동작 개선 옵션 확대 |
| Remove 32-bit x86 Port | Removed | 레거시 플랫폼 지원 정리 |

## 3) 대표 기능 설명

### Scoped Values 정식화 + Structured Concurrency 고도화

Java 25에서 실무 체감이 큰 포인트는
요청 단위 동시성 제어와 컨텍스트 전달 모델의 조합입니다.

* `Scoped Values`는 정식화되어 안정적 도입이 가능해졌고,
* `Structured Concurrency`는 프리뷰지만 운영 패턴이 더 구체화되었습니다.

적용 포인트:

* 외부 API를 병렬 호출하는 집계 API
* 취소/타임아웃 전파 규칙이 중요한 서비스
* ThreadLocal 대체 전략이 필요한 고동시성 시스템

## 4) 변경사항별 코드 예시

### 4-1. Structured Concurrency (Fifth Preview)

```java
// preview 개념 예시
// try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
//     var user = scope.fork(() -> userClient.get(userId));
//     var orders = scope.fork(() -> orderClient.list(userId));
//     scope.join().throwIfFailed();
//     return new Dashboard(user.get(), orders.get());
// }
```

설명:

* 하위 작업의 실패/취소를 요청 스코프에서 일관되게 처리
* 타임아웃 정책/부분 실패 처리 코드 단순화

### 4-2. Scoped Values (Final)

```java
// 개념 예시
// static final ScopedValue<String> TRACE_ID = ScopedValue.newInstance();
// ScopedValue.where(TRACE_ID, "trace-2501").run(() -> service.handle());
```

설명:

* 읽기 중심 컨텍스트 전달 패턴을 정식 기능으로 사용 가능
* ThreadLocal 누수 리스크 완화에 유리

### 4-3. JFR 관측 강화 기능 활용 예시

```text
# JFR 기록 시작 예시
java -XX:StartFlightRecording=filename=app.jfr,dumponexit=true -jar app.jar
```

설명:

* CPU 시간/메서드 타이밍/샘플링 관련 기능 강화로 병목 분석 정밀도 향상
* 고부하 시스템의 성능 튜닝 근거 확보에 유리

### 4-4. Module Import Declarations (Final) 개념 예시

```java
// 개념 예시
// import module java.base;
```

설명:

* 모듈 단위 import 표현으로 코드 간결화
* 학습 코드/샘플 코드 가독성 개선

### 4-5. Flexible Constructor Bodies (Final) 개념 예시

```java
// 개념 예시
// 생성자 본문에서 super(...) 호출 전/후 로직 표현 유연성 확대
```

설명:

* 상속 구조의 생성자 검증/초기화 코드 정리 용이

### 4-6. Primitive Types in Patterns (Third Preview)

```java
// preview 개념 예시
// primitive 타입 대상 패턴 매칭 표현력 확장
```

설명:

* 분기 로직을 패턴 중심으로 일관되게 표현하는 흐름 지속

### 4-7. Vector API (Tenth Incubator) 개념 예시

```java
// incubator 개념 예시
// SIMD 기반 연산 최적화 실험 지속
```

설명:

* 수치 연산/신호 처리/ML 전처리 워크로드에서 성능 개선 가능성

### 4-8. Generational Shenandoah 개념 예시

```text
# Shenandoah 활성화 예시
java -XX:+UseShenandoahGC -jar app.jar
```

설명:

* 세대 기반 동작 옵션을 통해 지연시간/처리량 균형 최적화 여지 확대

## 5) 이전 버전(Java 24)과 차이점

| 비교 항목 | Java 24 | Java 25 |
| ----- | ------- | ------- |
| 동시성 | 개선 흐름 지속 | Structured Concurrency 5차, Scoped Values Final |
| 컨텍스트 전달 | preview/검증 중심 | Scoped Values 정식 사용 가능 |
| 관측성 | 일반 JFR 사용 중심 | CPU-Time/Method Timing 등 JFR 기능 강화 |
| 런타임/GC | 전환 준비 성격 | Generational Shenandoah 포함 운영 튜닝 폭 확대 |
| 플랫폼 지원 | 레거시 포함 | 32-bit x86 포트 제거 |

핵심 정리:

* Java 24가 다음 전환을 준비하는 릴리스였다면,
* Java 25는 동시성·관측성·런타임 튜닝 관점에서 실전 적용 기준을 더 명확히 만든 버전입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
| ----- | ----- |
| 프리뷰 관리 | Structured Concurrency/Pattern 기능 사용 시 `--enable-preview` 일관 적용 |
| 컨텍스트 전략 | ThreadLocal 사용 지점을 Scoped Values 전환 후보로 분류 |
| 성능 관측 | JFR 기반 CPU/메서드 지표 수집 대시보드 준비 |
| GC 튜닝 | G1/ZGC/Shenandoah 지표 비교 후 서비스별 기본값 결정 |
| 플랫폼 점검 | 32-bit x86 의존 요소 존재 여부 사전 확인 |
