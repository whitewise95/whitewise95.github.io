---
layout: post
title: "Java 19 주요 변경사항"
date: 2026-03-28 00:00:00 +0900
categories: [Java]
tags: [java, java-19, release-notes, virtual-threads, loom, structured-concurrency]
permalink: /java/java-19-major-changes/
---

## 개요

Java 19는 **2022년 9월**에 출시된 비LTS(단기 지원) 릴리스입니다.
이 버전의 핵심은 Project Loom 흐름으로,
가상 스레드(Preview)와 구조화 동시성(Incubator) 같은 동시성 모델 변화가 본격적으로 등장했습니다.

이 글은 Java 19의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 18)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 19 |
| 출시년도 | 2022년 |
| 릴리스 성격 | 단기 릴리스(비LTS), 동시성 모델 실험 본격화 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| Virtual Threads (Preview) | 경량 스레드를 대량 생성 가능 | I/O 중심 서버 동시성 처리 구조 변화 |
| Structured Concurrency (Incubator) | 작업 묶음 실행/취소/수집 모델 제공 | 병렬 요청 처리 코드 안정성 향상 |
| Record Patterns (Preview) | record 분해 매칭 지원 | 데이터 분해 로직 가독성 향상 |
| Pattern Matching for `switch` (3rd Preview) | 패턴 기반 switch 개선 지속 | 복합 타입 분기 표현력 강화 |
| FFM API (Preview/Incubator 진화) | 네이티브 호출/메모리 접근 모델 확장 | JNI 대체 경로 연구 심화 |
| Vector API (4th Incubator) | SIMD API 개선 지속 | 수치 연산 최적화 실험 지속 |
| Linux/RISC-V Port | 아키텍처 지원 확대 | 멀티 플랫폼 선택지 증가 |

## 3) 대표 기능 설명

### Virtual Threads (Preview)

Java 19의 대표 기능은 **가상 스레드**입니다.
기존 플랫폼 스레드는 수가 많아질수록 메모리/스케줄링 비용이 커졌지만,
가상 스레드는 경량 스케줄링 모델을 통해 대규모 동시성 처리 가능성을 크게 높였습니다.

적용 포인트:

- DB/API 호출이 많은 I/O 중심 서비스에서 효과가 큼
- 기존 "스레드 풀 크기 튜닝" 중심 전략을 재검토할 필요
- CPU 바운드 작업에는 기존 병렬 처리 전략과 혼합 설계 권장

## 4) 변경사항별 예시

### 4-1. Virtual Threads 기본 사용

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VirtualThreadBasicExample {
    public static void main(String[] args) {
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 5; i++) {
                int taskId = i;
                executor.submit(() -> {
                    System.out.println("task=" + taskId + ", thread=" + Thread.currentThread());
                    return null;
                });
            }
        }
    }
}
```

설명:

- 태스크마다 가상 스레드 할당
- 동시 연결이 많은 서버 워크로드에서 구조 단순화 가능

### 4-2. Virtual Thread 직접 생성

```java
public class VirtualThreadStartExample {
    public static void main(String[] args) throws InterruptedException {
        Thread vThread = Thread.ofVirtual().start(() -> {
            System.out.println("hello from virtual thread");
        });

        vThread.join();
    }
}
```

설명:

- 플랫폼 스레드와 유사한 사용 방식
- 기존 코드 전환 실험에 진입 장벽이 낮음

### 4-3. Preview 기능 컴파일/실행 (가상 스레드)

```text
# 컴파일
javac --enable-preview --release 19 VirtualThreadBasicExample.java

# 실행
java --enable-preview VirtualThreadBasicExample
```

설명:

- Java 19에서 가상 스레드는 preview
- CI 파이프라인에 preview 옵션 누락 여부 확인 필요

### 4-4. Structured Concurrency (Incubator) 개념 예시

```java
// 개념 예시: jdk.incubator.concurrent 패키지
// 병렬 하위 작업을 하나의 스코프로 묶어 취소/예외/결과 수집을 관리
```

설명:

- "한 요청 = 여러 하위 호출" 패턴에서 실패 전파/취소 처리가 단순해짐
- 타임아웃/부분 실패 처리 정책을 일관되게 적용하기 쉬움

### 4-5. Record Patterns (Preview) 개념 예시

```java
record User(String name, int age) {}

public class RecordPatternPreviewExample {
    public static void print(Object obj) {
        if (obj instanceof User(String name, int age)) {
            System.out.println(name + ":" + age);
        }
    }
}
```

설명:

- record 객체 분해를 패턴으로 표현 가능
- DTO 분해/검증 로직 가독성 향상

### 4-6. Pattern Matching for `switch` (3rd Preview) 예시

```java
public class SwitchPatternJava19 {
    public static String describe(Object value) {
        return switch (value) {
            case Integer i -> "int=" + i;
            case String s -> "string=" + s;
            case null -> "null";
            default -> "other";
        };
    }
}
```

설명:

- 타입 패턴과 `switch` 결합으로 분기 코드가 명확해짐
- preview 기능이므로 컴파일/런타임 플래그 필요

### 4-7. FFM API 개념 예시

```java
// 개념 예시: jdk.incubator.foreign 패키지
// 네이티브 라이브러리 함수 호출과 메모리 접근을 안전하게 모델링
```

설명:

- JNI 코드량 감소 가능성
- 성능과 안전성 균형을 검증하며 도입 필요

### 4-8. Vector API (4th Incubator) 개념 예시

```java
// 개념 예시: jdk.incubator.vector 패키지
// SIMD 가속 대상 알고리즘을 자바 코드로 표현
```

설명:

- 이미지/통계/시계열 등 반복 연산에서 최적화 가능
- 실제 도입은 벤치마크 기반 의사결정 권장

## 5) 이전 버전(Java 18)과 차이점

| 비교 항목 | Java 18 | Java 19 |
|---|---|---|
| 핵심 방향 | 기본값/개발 경험 개선 | 동시성 패러다임 실험 본격화 |
| 대표 기능 | UTF-8 기본화, `jwebserver` | virtual threads preview |
| 병렬 처리 모델 | 기존 스레드/풀 중심 | 경량 스레드 + 구조화 동시성 실험 |
| 패턴 매칭 | 점진 개선 | switch/record 패턴 실험 확장 |
| 실무 전략 | 안정적 개선 반영 | POC/성능 검증 중심 도입 판단 |

핵심 정리:

- Java 18이 개발 생산성의 마찰을 줄인 버전이라면,
- Java 19는 동시성 모델 자체를 재설계할 수 있는 가능성을 연 버전입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| 가상 스레드 후보 선정 | I/O 대기 비중이 높은 API/배치 구간 식별 |
| 성능 검증 | 기존 스레드풀 대비 처리량/지연/메모리 비교 |
| 실패 전파 정책 | 구조화 동시성 적용 시 취소/타임아웃 정책 수립 |
| preview 기능 정책 | 로컬/CI/운영 환경에서 preview 사용 범위 명확화 |
| 라이브러리 호환성 | 드라이버/프레임워크의 Loom 친화성 점검 |

## 마무리

Java 19는 "미래의 자바 서버 동시성 모델"을 미리 체험해볼 수 있는 전환점입니다.
다음 글(Java 20)에서는 Loom 관련 후속 개선과 record/switch 패턴 진화를 중심으로 이어서 정리하겠습니다.
