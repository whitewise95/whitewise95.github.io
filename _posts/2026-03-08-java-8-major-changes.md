---
layout: post
title: "Java 8 주요 변경사항"
date: 2026-03-08 00:00:00 +0900
categories: [Java]
tags: [java, java-8, release-notes, lambda, stream]
permalink: /java/java-8-major-changes/
---

## 개요

Java 8은 **2014년 3월**에 출시된 버전으로, Java 개발 방식 자체를 바꾼 전환점입니다.
특히 함수형 스타일, Stream 기반 데이터 처리, 새로운 날짜/시간 API, 비동기 처리 모델이 한 번에 들어오면서
현대 Java 코드 스타일의 기준이 Java 8에서 사실상 확립됐습니다.

이 글은 실무자가 바로 참고할 수 있도록 다음 순서로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. Java 7 대비 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 8 |
| 출시년도 | 2014년 |
| 릴리스 성격 | 언어/표준 라이브러리/동시성 모델의 대규모 변화 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| Lambda 표현식 | 익명 클래스 대체 문법 | 이벤트 처리, 컬렉션 처리 코드 축소 |
| 메서드 레퍼런스 | 기존 메서드를 함수처럼 전달 | 람다 보일러플레이트 감소 |
| 함수형 인터페이스 | `@FunctionalInterface` 기반 표준화 | API 설계 일관성 향상 |
| Stream API | 선언형 데이터 파이프라인 | 복잡한 루프/임시 변수 감소 |
| Optional | null 처리 명시화 | NPE 방지 및 의도 표현 강화 |
| 인터페이스 default/static 메서드 | 인터페이스 진화 가능 | 하위 호환성 유지한 기능 확장 |
| java.time API | 불변 기반 날짜/시간 모델 | 시간대/포맷 버그 감소 |
| CompletableFuture | 비동기 작업 조합 | 콜백 지옥 완화, 병렬 처리 가독성 향상 |

## 3) 대표 기능 설명

### Lambda + Stream

Java 8의 대표 변화는 "반복문 중심 코드"에서 "데이터 변환 파이프라인"으로의 이동입니다.
이 변화 덕분에 코드의 의도가 선명해지고, 테스트와 리팩터링도 쉬워졌습니다.

적용 포인트:

- 루프가 길고 조건 분기가 많은 구간을 우선 Stream으로 치환
- 공통 필터/매핑을 메서드 레퍼런스로 분리
- 병렬화는 `parallelStream()`을 바로 쓰기보다 성능 측정 후 도입

## 4) 변경사항별 예시

### 4-1. Lambda 표현식

기존 익명 클래스 대비 코드 길이를 크게 줄일 수 있습니다.

```java
import java.util.Arrays;
import java.util.List;

public class LambdaExample {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Kim", "Lee", "Park");

        // Java 8 Lambda
        names.forEach(name -> System.out.println("Hello, " + name));
    }
}
```

### 4-2. 메서드 레퍼런스

람다에서 단순 전달만 하는 경우 메서드 레퍼런스로 더 읽기 좋게 만들 수 있습니다.

```java
import java.util.Arrays;
import java.util.List;

public class MethodReferenceExample {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Kim", "Lee", "Park");
        names.forEach(System.out::println);
    }
}
```

### 4-3. 함수형 인터페이스

함수형 인터페이스는 "추상 메서드 하나"를 가진 인터페이스입니다.
`Predicate`, `Function`, `Consumer`, `Supplier`를 자주 사용합니다.

```java
import java.util.function.Function;
import java.util.function.Predicate;

public class FunctionalInterfaceExample {
    public static void main(String[] args) {
        Predicate<String> isLong = s -> s.length() >= 5;
        Function<String, String> upper = String::toUpperCase;

        String input = "java8";
        if (isLong.test(input)) {
            System.out.println(upper.apply(input));
        }
    }
}
```

### 4-4. Stream API

filter-map-collect 패턴은 Java 8 이후 가장 기본적인 컬렉션 처리 방식입니다.

```java
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class StreamExample {
    public static void main(String[] args) {
        List<String> users = Arrays.asList("alice", "bob", "andrew", "anna", "david");

        List<String> result = users.stream()
                .filter(u -> u.startsWith("a"))
                .map(String::toUpperCase)
                .sorted()
                .collect(Collectors.toList());

        System.out.println(result); // [ALICE, ANDREW, ANNA]
    }
}
```

### 4-5. Optional

null 가능성을 타입으로 표현해 방어 코드를 명확하게 작성할 수 있습니다.

```java
import java.util.Optional;

public class OptionalExample {
    static Optional<String> findNickname(boolean exists) {
        return exists ? Optional.of("whitewise95") : Optional.empty();
    }

    public static void main(String[] args) {
        String nickname = findNickname(false)
                .map(String::toUpperCase)
                .orElse("GUEST");

        System.out.println(nickname); // GUEST
    }
}
```

### 4-6. 인터페이스 default/static 메서드

기존 인터페이스에 메서드를 추가해도 구현체를 모두 수정하지 않게 만들어 줍니다.

```java
interface Logger {
    void log(String message);

    default void info(String message) {
        log("[INFO] " + message);
    }

    static Logger console() {
        return System.out::println;
    }
}

public class DefaultMethodExample {
    public static void main(String[] args) {
        Logger logger = Logger.console();
        logger.info("service started");
    }
}
```

### 4-7. java.time API

`Date`, `Calendar` 중심의 가변 객체 모델을 대체합니다.
`LocalDate`, `LocalDateTime`, `ZonedDateTime`, `Duration` 조합이 핵심입니다.

```java
import java.time.Duration;
import java.time.LocalDateTime;

public class JavaTimeExample {
    public static void main(String[] args) {
        LocalDateTime start = LocalDateTime.of(2026, 3, 8, 9, 0);
        LocalDateTime end = start.plusHours(2).plusMinutes(30);

        Duration duration = Duration.between(start, end);
        System.out.println(duration.toMinutes()); // 150
    }
}
```

### 4-8. CompletableFuture

비동기 작업을 선언형으로 연결할 수 있습니다.
콜백 중첩보다 예외 처리와 조합(`thenCombine`, `allOf`)이 훨씬 명확합니다.

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

public class CompletableFutureExample {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        CompletableFuture<String> userFuture = CompletableFuture.supplyAsync(() -> "whitewise95");
        CompletableFuture<Integer> scoreFuture = CompletableFuture.supplyAsync(() -> 100);

        CompletableFuture<String> summaryFuture = userFuture.thenCombine(
                scoreFuture,
                (user, score) -> user + " score=" + score
        );

        System.out.println(summaryFuture.get());
    }
}
```

## 5) 이전 버전(Java 7)과 차이점

| 비교 항목 | Java 7 스타일 | Java 8 스타일 |
|---|---|---|
| 컬렉션 처리 | 반복문 + 임시 변수 | Stream 파이프라인 |
| 이벤트/콜백 | 익명 클래스 | Lambda/메서드 레퍼런스 |
| null 처리 | if-null 다중 분기 | Optional 기반 체인 |
| 날짜/시간 | `Date`/`Calendar` | `java.time` 불변 타입 |
| 비동기 처리 | Future + 수동 조합 | CompletableFuture 체인 |

정리하면 Java 8의 변화는 "문법 편의" 수준이 아니라,
**코드 구조, API 설계, 비동기 모델, 시간 처리 표준**을 동시에 바꾼 변화입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| 컴파일 옵션 | 빌드 툴의 source/target 1.8 설정 확인 |
| 라이브러리 호환 | 프레임워크의 Java 8 지원 버전 점검 |
| 스트림 도입 범위 | 성능 민감 구간은 벤치마크 후 전환 |
| Optional 사용 원칙 | 필드보다는 반환 타입 중심으로 도입 |
| 시간 API 전환 | 신규 코드부터 `java.time` 우선 적용 |

## 마무리

Java 8은 이후 Java 버전 학습의 출발점입니다.
다음 버전 글(Java 9)을 읽을 때는 "모듈 시스템이 Java 8 위에 어떤 제약과 구조를 추가했는지"를 중심으로 보면 전체 흐름을 빠르게 이해할 수 있습니다.
