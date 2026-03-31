---
layout: post
title: "Java 21 주요 변경사항"
date: 2026-03-31 00:00:00 +0900
categories: [Java]
tags: [java, java-21, release-notes, lts, virtual-threads, sequenced-collections]
permalink: /java/java-21-major-changes/
---

## 개요

Java 21은 **2023년 9월**에 출시된 **LTS(장기 지원) 버전**입니다.
Java 19~20에서 preview/incubator로 다듬어졌던 핵심 기능들이 Java 21에서 대거 정식화되었습니다.

이 글은 Java 21의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 20)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 21 |
| 출시년도 | 2023년 |
| 릴리스 성격 | LTS (Long-Term Support) |

## 2) 주요 변경사항 요약

| 변경사항 | 상태 | 실무 영향 |
|---|---|---|
| Virtual Threads | 정식 (Final) | 고동시성 서버에서 스레드 모델 단순화 |
| Record Patterns | 정식 (Final) | DTO 분해/검증 코드 간결화 |
| Pattern Matching for `switch` | 정식 (Final) | 분기 로직 가독성/안전성 개선 |
| Sequenced Collections | 정식 | 컬렉션의 순서 기반 API 표준화 |
| Generational ZGC | 정식 | 저지연 GC 성능 개선 |
| String Templates | Preview | 문자열 조합 안전성/가독성 개선 실험 |
| Unnamed Patterns/Variables | Preview | 불필요 변수 선언 감소 |
| Unnamed Classes & Instance Main | Preview | 학습/스크립트 진입 장벽 완화 |

## 3) 대표 기능 설명

### Virtual Threads 정식화

Java 21에서 가상 스레드가 정식 기능이 되면서,
동시성 코드를 리액티브/콜백 스타일로 과도하게 복잡하게 만들지 않고도 높은 동시성을 달성할 수 있게 됐습니다.

적용 포인트:

- 외부 I/O 대기 비중이 큰 API 서버
- 대량 크롤링/수집 배치
- 요청 단위 격리가 중요한 마이크로서비스

## 4) 변경사항별 예시

### 4-1. Virtual Threads (Final)

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VirtualThreadJava21 {
    public static void main(String[] args) {
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 5; i++) {
                int id = i;
                executor.submit(() -> {
                    System.out.println("task=" + id + ", thread=" + Thread.currentThread());
                    return null;
                });
            }
        }
    }
}
```

설명:

- Java 21부터 정식 기능이라 preview 플래그 없이 사용 가능
- 기존 플랫폼 스레드 풀 병목을 완화하는 데 유리

### 4-2. Record Patterns (Final)

```java
record Order(String orderNo, int amount) {}

public class RecordPatternJava21 {
    static String describe(Object value) {
        if (value instanceof Order(String orderNo, int amount)) {
            return orderNo + " / " + amount;
        }
        return "unknown";
    }
}
```

설명:

- 타입 검사 + 필드 분해를 한 번에 처리
- 검증/매핑 로직 가독성 향상

### 4-3. Pattern Matching for `switch` (Final)

```java
public class SwitchPatternJava21 {
    static String route(Object payload) {
        return switch (payload) {
            case Integer i -> "number=" + i;
            case String s when s.isBlank() -> "blank";
            case String s -> "text=" + s;
            case null -> "null";
            default -> "other";
        };
    }
}
```

설명:

- `if-else` 체인 대비 타입 기반 분기 표현력 강화
- 누락 분기/기본 분기 관리가 쉬워짐

### 4-4. Sequenced Collections

```java
import java.util.LinkedHashSet;
import java.util.SequencedSet;

public class SequencedCollectionJava21 {
    public static void main(String[] args) {
        SequencedSet<String> tags = new LinkedHashSet<>();
        tags.add("spring");
        tags.add("java");
        tags.add("batch");

        System.out.println(tags.getFirst()); // spring
        System.out.println(tags.getLast());  // batch
        System.out.println(tags.reversed()); // 역순 뷰
    }
}
```

설명:

- 리스트/셋/맵의 순서 접근 API가 표준화됨
- `first/last/reversed` 같은 표현을 일관되게 사용 가능

### 4-5. String Templates (Preview)

```java
// preview 개념 예시
// String name = "whitewise";
// String msg = STR."Hello, \{name}";
```

설명:

- 문자열 보간/조합을 타입 안전하게 다루기 위한 실험 기능
- SQL/JSON 템플릿 생성 안정성 개선 가능성

### 4-6. Unnamed Patterns/Variables (Preview)

```java
// preview 개념 예시
// if (obj instanceof User(_, int age)) {
//     System.out.println(age);
// }
```

설명:

- 사용하지 않는 패턴 변수 선언을 줄여 코드 노이즈 감소

### 4-7. Unnamed Classes & Instance Main (Preview)

```java
// preview 개념 예시
// class 없이 간단한 실행 진입점을 제공하는 실험 기능
```

설명:

- 교육/샘플/스크립트성 코드 작성 진입장벽 완화

### 4-8. Generational ZGC

```text
# 예시: ZGC 활성화
java -XX:+UseZGC -jar app.jar
```

설명:

- 저지연 GC인 ZGC에 세대(young/old) 개념이 도입되어
  처리량과 지연시간 균형 개선 기대

## 5) 이전 버전(Java 20)과 차이점

| 비교 항목 | Java 20 | Java 21 |
|---|---|---|
| 릴리스 타입 | 비LTS | LTS |
| Virtual Threads | 2nd Preview | Final |
| Record Patterns | 2nd Preview | Final |
| switch 패턴 매칭 | 4th Preview | Final |
| 컬렉션 순서 API | 없음 | Sequenced Collections 추가 |
| GC | ZGC 개선 진행 | Generational ZGC 도입 |

핵심 정리:

- Java 20이 실험 품질을 높인 단계였다면,
- Java 21은 실서비스에 적용 가능한 기준점을 제공한 LTS입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| JDK 업그레이드 | 빌드/런타임 JDK를 21로 통일 |
| 동시성 전략 | I/O 중심 구간부터 가상 스레드 점진 도입 |
| 분기 리팩토링 | `instanceof` + 캐스팅 코드를 switch 패턴으로 정리 |
| 컬렉션 API | 순서 기반 접근 코드를 Sequenced API로 표준화 |
| GC 튜닝 | 기존 GC 대비 ZGC/Generational ZGC 성능 비교 |

## 마무리

Java 21은 최근 Java 릴리스 중 실무 체감이 큰 전환점입니다.
특히 가상 스레드 정식화와 패턴 매칭 정식화는 코드 구조와 운영 전략 모두에 직접적인 영향을 줍니다.

다음 글(Java 22)에서는 Java 21 이후에 추가된 preview 기능의 방향성과
실험 기능을 안전하게 검증하는 전략을 이어서 정리하겠습니다.
