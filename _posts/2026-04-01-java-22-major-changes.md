---
layout: post
title: "Java 22 주요 변경사항"
date: 2026-04-01 00:00:00 +0900
categories: [Java]
tags: [java, java-22, release-notes, ffm, stream-gatherers, structured-concurrency]
permalink: /java/java-22-major-changes/
---

## 개요

Java 22는 **2024년 3월**에 출시된 비LTS 릴리스입니다.
Java 21 LTS 이후, 실무에 바로 영향이 큰 API 정식화(FFM)와
동시성/데이터 처리 관련 preview 기능이 확장된 버전입니다.

이 글은 Java 22의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 21)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 22 |
| 출시년도 | 2024년 |
| 릴리스 성격 | 단기 릴리스(비LTS) |

## 2) 주요 변경사항 요약

| 변경사항 | 상태 | 실무 영향 |
|---|---|---|
| Foreign Function & Memory API | 정식(Final) | JNI 대체 경로를 표준 API로 사용 가능 |
| Stream Gatherers | Preview | 스트림 파이프라인에 사용자 정의 중간 연산 도입 |
| Structured Concurrency | 2nd Preview | 요청 단위 병렬 작업 취소/실패 전파 단순화 |
| Scoped Values | 2nd Preview | 가상 스레드 환경 컨텍스트 전달 개선 |
| String Templates | 2nd Preview | 안전한 문자열 조합 방식 검증 지속 |
| Unnamed Variables & Patterns | 정식(Final) | 불필요 변수 선언 제거로 코드 간결화 |
| Class-File API | Preview | 바이트코드 가공/분석 표준 API 제공 |
| Statements before `super(...)` | Preview | 생성자 초기화 유연성 증가 |

## 3) 대표 기능 설명

### Foreign Function & Memory API 정식화

Java 22에서 FFM API가 정식 기능이 되면서,
C 라이브러리 호출이나 네이티브 메모리 접근 시 JNI 의존도를 줄일 수 있는 기반이 마련됐습니다.

적용 포인트:

- 고성능 네이티브 라이브러리 연동
- 기존 JNI 래퍼 코드의 유지보수 부담 감소
- 메모리 접근 안정성/가독성 개선

## 4) 변경사항별 코드 예시

### 4-1. FFM API (Final) 개념 예시

```java
// Java 22: FFM API는 정식 기능
// 예시 목적 코드 (개념)
// Linker linker = Linker.nativeLinker();
// SymbolLookup stdlib = linker.defaultLookup();
// MemorySegment strlen = stdlib.find("strlen").orElseThrow();
```

설명:

- 네이티브 함수 심볼 조회/호출 흐름을 표준 API로 구성 가능
- JNI 대비 선언적이고 테스트 가능한 구조를 만들기 쉬움

### 4-2. Stream Gatherers (Preview)

```java
// preview 개념 예시
// Stream.of(1, 2, 3, 4, 5)
//       .gather(...)
//       .forEach(System.out::println);
```

설명:

- `map/filter`만으로 표현하기 어려운 사용자 정의 중간 처리 로직을
  스트림 파이프라인에 자연스럽게 삽입 가능

### 4-3. Structured Concurrency (2nd Preview)

```java
// preview 개념 예시
// try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
//     var user = scope.fork(() -> userClient.getUser(id));
//     var orders = scope.fork(() -> orderClient.getOrders(id));
//     scope.join().throwIfFailed();
// }
```

설명:

- 여러 원격 호출의 성공/실패/취소를 요청 단위로 묶어 제어
- 타임아웃/부분 실패 처리 코드를 일관되게 작성 가능

### 4-4. Scoped Values (2nd Preview)

```java
// preview 개념 예시
// static final ScopedValue<String> TRACE_ID = ScopedValue.newInstance();
// ScopedValue.where(TRACE_ID, "tx-123").run(() -> service.call());
```

설명:

- ThreadLocal 대안으로 읽기 중심 컨텍스트 전달 패턴 제공
- 가상 스레드 환경에서 컨텍스트 누수 위험 완화

### 4-5. String Templates (2nd Preview)

```java
// preview 개념 예시
// String name = "whitewise";
// String message = STR."Hello, \{name}";
```

설명:

- 문자열 결합 시 타입/문맥 검증 가능성 제공
- SQL/JSON 구성의 안전성 향상을 위한 기반

### 4-6. Unnamed Variables & Patterns (Final)

```java
import java.util.List;

public class UnnamedVariableJava22 {
    public static void main(String[] args) {
        List<String> names = List.of("kim", "lee", "park");

        for (var _ : names) {
            System.out.println("processing...");
        }
    }
}
```

설명:

- 실제로 쓰지 않는 지역 변수/패턴 변수의 의도를 명확히 표현
- "안 쓰는 값" 관련 코드 노이즈 감소

### 4-7. Class-File API (Preview)

```java
// preview 개념 예시
// class 파일 파싱/생성/변환을 위한 표준 API 제공
```

설명:

- 바이트코드 도구/프레임워크의 내부 구현을 더 안정적으로 구성 가능
- ASM 등 외부 라이브러리 의존 구조를 일부 대체할 여지

### 4-8. Statements before `super(...)` (Preview)

```java
// preview 개념 예시
// 생성자에서 super(...) 호출 전에 사전 검증/정규화 코드 배치 가능
```

설명:

- 상속 구조 초기화 로직의 표현력 확대
- 생성자 내부 전처리 코드 가독성 개선

## 5) 이전 버전(Java 21)과 차이점

| 비교 항목 | Java 21 | Java 22 |
|---|---|---|
| 릴리스 타입 | LTS | 비LTS |
| FFM API | Preview 계열 | Final |
| 스트림 확장성 | 기존 중간 연산 중심 | Gatherers(Preview) 도입 |
| 동시성 모델 | 가상 스레드 Final | 구조화 동시성/Scoped Values 개선 지속 |
| 언어 문법 | 패턴 매칭/레코드 패턴 Final | Unnamed 변수 Final + 추가 preview 다수 |

핵심 정리:

- Java 21이 안정적인 LTS 기준점이라면,
- Java 22는 네이티브 연동과 동시성/스트림 확장을 실험·적용하는 확장판입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| 네이티브 연동 | JNI 사용 지점을 FFM API로 대체 가능한지 검토 |
| 동시성 정책 | Structured Concurrency/Scoped Values를 POC로 검증 |
| 스트림 파이프라인 | 복잡한 중간 처리 로직을 Gatherers로 단순화 가능한지 확인 |
| 프리뷰 관리 | `--enable-preview` 적용 범위를 로컬/CI에서 일치시킴 |
| 릴리스 전략 | 비LTS 특성상 운영 반영 전 성능/호환성 점검 필수 |

## 마무리

Java 22는 "정식화된 FFM API"와 "확장되는 preview 생태계"가 공존하는 버전입니다.
운영 기준은 Java 21 LTS에 두되, Java 22의 기능을 사전 검증해 두면
다음 LTS 전환 시점에 훨씬 빠르게 대응할 수 있습니다.

다음 글(Java 23)에서는 Java 22에서 이어진 preview 기능들의 변화와
실무 적용 시 주의 포인트를 정리하겠습니다.
