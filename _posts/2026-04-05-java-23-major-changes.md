---
layout: post
title: "Java 23 주요 변경사항"
date: 2026-04-05 00:00:00 +0900
categories: [Java]
tags: [java, java-23, release-notes, stream-gatherers, scoped-values, structured-concurrency]
permalink: /java/java-23-major-changes/
---

## 개요

Java 23은 **2024년 9월 17일**에 출시된 비LTS 릴리스입니다.
Java 22의 방향을 이어받아 동시성/문법/도구 영역의 preview 기능이 확장되었고,
일부 API와 런타임 기본 동작이 실무 친화적으로 개선되었습니다.

이 글은 Java 23의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 22)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 23 |
| 출시일 | 2024-09-17 |
| 릴리스 성격 | 단기 릴리스(비LTS) |

## 2) 주요 변경사항 요약

| 변경사항 | 상태 | 실무 영향 |
|---|---|---|
| Primitive Types in Patterns / `instanceof` / `switch` | Preview | 패턴 매칭 표현력 강화 |
| Class-File API | 2nd Preview | 바이트코드 분석/생성 표준 API 성숙 |
| Markdown Documentation Comments | Final | Javadoc 문서 작성성 개선 |
| Vector API | 8th Incubator | SIMD 최적화 실험 지속 |
| Stream Gatherers | 2nd Preview | 스트림 파이프라인 확장성 향상 |
| ZGC Generational Mode by Default | Final | ZGC 사용 시 기본 모드 개선 |
| Module Import Declarations | Preview | 모듈 import 문법 실험 |
| Implicitly Declared Classes & Instance Main Methods | 3rd Preview | 학습/스크립트 진입 장벽 완화 |
| Structured Concurrency | 3rd Preview | 병렬 작업 실패/취소 제어 정교화 |
| Scoped Values | 3rd Preview | 컨텍스트 전달 모델 개선 지속 |
| Flexible Constructor Bodies | 2nd Preview | `super(...)` 이전 문장 유연성 확대 |

## 3) 대표 기능 설명

### Structured Concurrency + Scoped Values 진화

Java 23의 실무 체감 포인트는 동시성 모델 개선의 연속성입니다.
가상 스레드 기반 환경에서 요청 단위 작업을 묶고,
컨텍스트를 안전하게 전달하는 패턴이 더 명확해졌습니다.

적용 포인트:

- 여러 외부 API 호출을 한 요청에서 병렬로 묶는 서비스
- 실패 전파/취소 규칙이 중요한 집계 API
- ThreadLocal 대체 컨텍스트 전략 검토 구간

## 4) 변경사항별 코드 예시

### 4-1. Structured Concurrency (3rd Preview)

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

- 하위 작업들을 요청 스코프로 묶어 생명주기/오류 처리 일관성 확보
- 부분 실패 시 취소 정책을 명확히 구현 가능

### 4-2. Scoped Values (3rd Preview)

```java
// preview 개념 예시
// static final ScopedValue<String> TRACE_ID = ScopedValue.newInstance();
// ScopedValue.where(TRACE_ID, "trace-20260405").run(() -> service.handle());
```

설명:

- 읽기 중심 컨텍스트 전달에서 ThreadLocal 대안 제공
- 동시성 구조가 복잡할수록 누수 리스크를 줄이는 데 유리

### 4-3. Stream Gatherers (2nd Preview)

```java
// preview 개념 예시
// Stream.of(1, 2, 3, 4, 5)
//       .gather(...)
//       .forEach(System.out::println);
```

설명:

- 사용자 정의 중간 연산을 스트림 파이프라인에 결합 가능
- 데이터 변환 파이프라인 구성 유연성 향상

### 4-4. Markdown Documentation Comments (Final)

```java
/// # 결제 서비스
/// 결제 승인/취소 API를 제공합니다.
///
/// - 승인: `approve()`
/// - 취소: `cancel()`
public class PaymentService {
    public void approve() {}
    public void cancel() {}
}
```

설명:

- Markdown 기반 주석으로 API 문서 가독성 개선
- 개발 문서와 코드 주석 사이 괴리 감소

### 4-5. Primitive Types in Patterns (Preview)

```java
// preview 개념 예시
// primitive 대상 패턴 매칭 표현력 확장
```

설명:

- 패턴 매칭이 다루는 타입 범위 확장 시도
- 분기 로직을 더 일관된 방식으로 구성 가능

### 4-6. Module Import Declarations (Preview)

```java
// preview 개념 예시
// import module java.base;
```

설명:

- 모듈 단위 import 문법 실험
- 초중급 학습 흐름/샘플 코드 단순화에 기여 가능

### 4-7. Flexible Constructor Bodies (2nd Preview)

```java
// preview 개념 예시
// 생성자에서 super(...) 이전 전처리 코드 표현 유연성 개선
```

설명:

- 상속 구조 초기화 로직 가독성 향상
- 생성자 내 검증/정규화 패턴 표현이 쉬워짐

### 4-8. ZGC Generational Mode 기본화

```text
# ZGC 사용 예시
java -XX:+UseZGC -jar app.jar
```

설명:

- Java 23에서는 ZGC의 세대 모드가 기본 동작으로 반영
- 저지연 운영 환경에서 GC 튜닝 기준이 이전 버전과 달라질 수 있음

## 5) 이전 버전(Java 22)과 차이점

| 비교 항목 | Java 22 | Java 23 |
|---|---|---|
| Structured Concurrency | 2nd Preview | 3rd Preview |
| Scoped Values | 2nd Preview | 3rd Preview |
| Stream Gatherers | Preview | 2nd Preview |
| Class-File API | Preview | 2nd Preview |
| 문서 주석 | 기존 Javadoc 중심 | Markdown Documentation Comments Final |
| ZGC | Generational ZGC 도입 | Generational 모드 기본화 |

핵심 정리:

- Java 22가 확장 기능 도입의 출발점이었다면,
- Java 23은 같은 축의 기능을 더 정교하게 다듬은 릴리스입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| 프리뷰 기능 관리 | `--enable-preview` 적용 범위 로컬/CI 통일 |
| 동시성 POC | Structured Concurrency/Scoped Values를 요청 단위로 검증 |
| 문서 체계 | Markdown Javadoc 도입 시 팀 문서 스타일 가이드 업데이트 |
| GC 관찰 | ZGC 사용 서비스에서 지연시간/처리량 지표 재측정 |
| 비LTS 전략 | 운영 반영 전 호환성/성능 점검 후 점진 배포 |

## 마무리

Java 23은 "대형 신규 기능 추가"보다
"이미 도입된 기능의 실전 적용 품질을 높이는" 성격이 강한 버전입니다.

운영 기준은 LTS(Java 21)에 두더라도,
Java 23에서 동시성/문서화/스트림 확장 기능을 미리 검증해두면
다음 LTS 전환 때 기술 부채를 크게 줄일 수 있습니다.

다음 글(Java 24)에서는 JDK 24에서 이어진 변경사항과
Java 25 LTS 전환 관점의 준비 포인트를 정리하겠습니다.
