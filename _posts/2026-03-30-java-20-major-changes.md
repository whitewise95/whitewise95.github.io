---
layout: post
title: "Java 20 주요 변경사항"
date: 2026-03-30 00:00:00 +0900
categories: [Java]
tags: [java, java-20, release-notes, virtual-threads, record-patterns, scoped-values]
permalink: /java/java-20-major-changes/
---

## 개요

Java 20은 **2023년 3월**에 출시된 비LTS(단기 지원) 릴리스입니다.
Java 19에서 시작된 Loom/패턴 매칭 흐름이 더 구체화되었고,
가상 스레드와 레코드 패턴 관련 미리보기 기능이 한 단계 성숙했습니다.

이 글은 Java 20의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 19)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 20 |
| 출시년도 | 2023년 |
| 릴리스 성격 | 단기 릴리스(비LTS), Loom/패턴 매칭 개선 지속 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| Virtual Threads (2nd Preview) | 가상 스레드 동작/디버깅 개선 | 고동시성 서버 실험 안정성 향상 |
| Structured Concurrency (2nd Incubator) | 병렬 작업 스코프 모델 개선 | 요청 단위 동시성 제어 품질 향상 |
| Scoped Values (Incubator) | 스레드 로컬 대안 컨텍스트 전달 모델 | 가상 스레드 환경 컨텍스트 전달 단순화 |
| Record Patterns (2nd Preview) | record 분해 패턴 보완 | DTO 분해/검증 코드 가독성 향상 |
| Pattern Matching for `switch` (4th Preview) | 패턴 switch 개선 지속 | 복합 분기 표현력 강화 |
| FFM API (2nd Preview) | 네이티브 호출/메모리 API 보강 | JNI 대체 경로 검증 고도화 |
| Vector API (5th Incubator) | SIMD API 개선 지속 | 수치 연산 최적화 실험 지속 |

## 3) 대표 기능 설명

### Virtual Threads (2nd Preview)

Java 20의 핵심은 Java 19에서 공개된 가상 스레드 모델이 더 안정된 형태로 다듬어졌다는 점입니다.
동시성 중심 애플리케이션에서 스레드 수 제약을 완화하고,
코드 구조를 콜백/리액티브 중심에서 "직관적인 순차 코드"로 유지할 수 있는 가능성이 커졌습니다.

적용 포인트:

- API 게이트웨이, 크롤러, 배치 I/O 작업처럼 대기 시간이 긴 워크로드에 우선 적용
- 기존 스레드풀 기반 제한 정책과 함께 점진적 전환 권장
- 모니터링 지표(처리량, 지연, 메모리) 기반으로 검증 필수

## 4) 변경사항별 예시

### 4-1. Virtual Thread Per Task Executor

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VirtualThreadJava20 {
    public static void main(String[] args) {
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 10; i++) {
                int id = i;
                executor.submit(() -> {
                    Thread.sleep(100);
                    System.out.println("task=" + id + ", thread=" + Thread.currentThread());
                    return null;
                });
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

설명:

- 요청 단위 작업을 가상 스레드로 직접 매핑 가능
- 높은 동시 접속 상황에서 플랫폼 스레드 고갈 위험 완화

### 4-2. Structured Concurrency (개념 예시)

```java
// 개념 예시: jdk.incubator.concurrent 패키지
// 여러 하위 작업을 하나의 스코프로 관리하고 예외/취소를 일관 처리
```

설명:

- "한 요청 안에서 여러 원격 호출" 패턴에 적합
- 타임아웃/실패 전파 정책 구현이 단순해짐

### 4-3. Scoped Values (Incubator) 개념 예시

```java
// 개념 예시: ScopedValue를 통해 읽기 전용 컨텍스트 전달
// ThreadLocal 대체 시나리오에서 가상 스레드 친화적 패턴 제공
```

설명:

- 인증/트레이싱 컨텍스트 전달에서 ThreadLocal 의존성 완화 가능
- 동시성 구조가 복잡한 코드에서 컨텍스트 누수 위험 감소

### 4-4. Record Patterns (2nd Preview)

```java
record User(String name, int age) {}

public class RecordPatternJava20 {
    static void print(Object value) {
        if (value instanceof User(String name, int age)) {
            System.out.println(name + "(" + age + ")");
        }
    }

    public static void main(String[] args) {
        print(new User("kim", 29));
    }
}
```

설명:

- 객체 분해와 타입 검사 동시 처리
- 데이터 파이프라인/검증 코드 가독성 향상

### 4-5. Pattern Matching for `switch` (4th Preview)

```java
public class SwitchPatternJava20 {
    static String describe(Object value) {
        return switch (value) {
            case Integer i -> "int=" + i;
            case String s -> "str=" + s;
            case null -> "null";
            default -> "other";
        };
    }
}
```

설명:

- 기존 if-else 체인을 패턴 switch로 대체 가능
- 복합 타입 분기 로직 유지보수성이 좋아짐

### 4-6. Preview/Incubator 컴파일 옵션 예시

```text
# preview 기능
javac --enable-preview --release 20 RecordPatternJava20.java
java --enable-preview RecordPatternJava20

# incubator 모듈(예: vector)
java --add-modules jdk.incubator.vector -version
```

설명:

- Java 20의 핵심 기능 상당수가 preview/incubator 상태
- 빌드 파이프라인 옵션 표준화가 중요

### 4-7. FFM API (2nd Preview) 개념 예시

```java
// 개념 예시: java.lang.foreign / jdk.incubator.foreign 흐름
// 네이티브 함수 호출과 메모리 접근 모델을 JNI보다 안전하게 표현
```

설명:

- C 라이브러리 연동 코드의 안전성과 생산성 개선 가능성
- 실무 도입 전 성능/호환성 검증 필요

### 4-8. Vector API (5th Incubator) 개념 예시

```java
// 개념 예시: jdk.incubator.vector
// 반복 수치 연산에 SIMD 최적화 적용 가능
```

설명:

- ML 전처리/시계열/이미지 처리처럼 계산량 많은 영역에서 유리
- 벤치마크로 JVM 옵션 및 알고리즘 조합 검증 권장

## 5) 이전 버전(Java 19)과 차이점

| 비교 항목 | Java 19 | Java 20 |
|---|---|---|
| 가상 스레드 | 1차 Preview | 2차 Preview |
| 구조화 동시성 | 1차 Incubator | 2차 Incubator |
| 컨텍스트 전달 | ThreadLocal 중심 | Scoped Values 실험 도입 |
| 레코드 패턴 | 1차 Preview | 2차 Preview |
| switch 패턴 | 3차 Preview | 4차 Preview |
| 네이티브 연동 | FFM 진화 시작 | FFM preview 개선 지속 |

핵심 정리:

- Java 19가 Loom 시대의 문을 연 버전이라면,
- Java 20은 실제 적용을 위한 실험 품질을 높인 버전입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| 적용 후보 선정 | I/O 비중 높은 API부터 가상 스레드 POC 수행 |
| 컨텍스트 전략 | ThreadLocal 사용 지점 파악 후 Scoped Values 도입 가능성 검토 |
| 에러/취소 정책 | 구조화 동시성 기준으로 요청 단위 취소 흐름 설계 |
| 빌드 옵션 관리 | preview/incubator 플래그를 로컬/CI에서 일관 적용 |
| 성능 검증 | 기존 모델 대비 처리량/지연/메모리 지표 비교 |

## 마무리

Java 20은 "가상 스레드 실전 도입 전 리허설"에 가장 적합한 릴리스입니다.
다음 글(Java 21)에서는 LTS 관점에서 가상 스레드 정식화와 record pattern/switch pattern 정식화 포인트를 중심으로 이어서 정리하겠습니다.
