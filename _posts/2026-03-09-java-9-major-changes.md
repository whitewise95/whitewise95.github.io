---
layout: post
title: "Java 9 주요 변경사항"
date: 2026-03-09 00:00:00 +0900
categories: [Java]
tags: [java, java-9, release-notes, jigsaw, module]
permalink: /java/java-9-major-changes/
---

## 개요

Java 9은 **2017년 9월** 출시 버전으로, Java 8 이후 가장 구조적인 변화를 가져온 릴리스입니다.
핵심은 JPMS(Java Platform Module System, 프로젝트 Jigsaw)이며,
언어 문법 자체보다 **플랫폼 구조와 API 경계 관리 방식**이 크게 바뀌었습니다.

이 글은 실무 관점에서 Java 9의 변경점을 빠르게 파악할 수 있도록 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. Java 8 대비 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 9 |
| 출시년도 | 2017년 |
| 릴리스 성격 | 모듈 시스템 도입 + 표준 API/도구 개선 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| JPMS(모듈 시스템) | `module-info.java`로 의존성/노출 제어 | 대규모 코드베이스 경계 명확화 |
| JShell | 공식 REPL 도구 | 학습/실험/디버깅 속도 향상 |
| 컬렉션 팩토리 메서드 | `List.of`, `Set.of`, `Map.of` | 불변 컬렉션 생성 코드 단축 |
| Stream API 개선 | `takeWhile`, `dropWhile`, `iterate` 확장 | 데이터 파이프라인 표현력 증가 |
| Optional 개선 | `ifPresentOrElse`, `or`, `stream` | null-safe 흐름 처리 유연성 증가 |
| 인터페이스 private 메서드 | 인터페이스 내부 로직 공통화 | default/static 메서드 중복 제거 |
| Try-with-resources 개선 | effectively final 변수 재사용 가능 | 리소스 관리 코드 간결화 |
| Process API 개선 | `ProcessHandle` 도입 | OS 프로세스 모니터링/제어 개선 |

## 3) 대표 기능 설명

### JPMS (Java Platform Module System)

Java 9의 대표 기능은 모듈 시스템입니다.
이전에는 JAR 단위 의존성만 관리했지만, Java 9부터는 **컴파일/런타임 수준에서 접근 가능 API를 선언적으로 통제**할 수 있습니다.

적용 포인트:

- 신규 서비스는 모듈 경계(공개 패키지/내부 패키지)부터 설계
- 레거시는 한 번에 쪼개지 말고 점진적으로 모듈화
- reflection 의존 라이브러리(Spring, Jackson 등)와의 호환 옵션 검토

## 4) 변경사항별 예시

### 4-1. JPMS: `module-info.java`

```java
module com.example.billing {
    requires java.sql;
    exports com.example.billing.api;
}
```

```java
package com.example.billing.api;

public class InvoiceService {
    public String issue() {
        return "issued";
    }
}
```

설명:

- `requires`: 필요한 모듈 선언
- `exports`: 외부에 공개할 패키지 지정
- 내부 구현 패키지는 export하지 않아 캡슐화 강화

### 4-2. JShell

Java 9부터 `jshell`로 빠르게 코드 실험이 가능합니다.

```text
jshell> var names = java.util.List.of("Kim", "Lee", "Park")
jshell> names.stream().map(String::toUpperCase).collect(java.util.stream.Collectors.toList())
$2 ==> [KIM, LEE, PARK]
```

설명:

- API 사용법 테스트, 알고리즘 검증, 교육/온보딩에 유용
- 작은 코드 검증은 IDE 프로젝트 생성 없이 즉시 가능

### 4-3. 컬렉션 팩토리 메서드

```java
import java.util.List;
import java.util.Map;
import java.util.Set;

public class CollectionFactoryExample {
    public static void main(String[] args) {
        List<String> roles = List.of("USER", "ADMIN");
        Set<Integer> ids = Set.of(1, 2, 3);
        Map<String, Integer> score = Map.of("kim", 90, "lee", 95);

        System.out.println(roles);
        System.out.println(ids);
        System.out.println(score);
    }
}
```

설명:

- 생성 즉시 불변 컬렉션
- `null` 요소/중복 키 허용 안 함(실수 조기 발견)

### 4-4. Stream API 개선

```java
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class StreamEnhancementExample {
    public static void main(String[] args) {
        System.out.println(Stream.of(1, 2, 3, 0, 4)
                .takeWhile(n -> n > 0)
                .collect(Collectors.toList())); // [1, 2, 3]

        System.out.println(Stream.of(1, 2, 3, 0, 4)
                .dropWhile(n -> n > 0)
                .collect(Collectors.toList())); // [0, 4]

        System.out.println(Stream.iterate(1, n -> n <= 10, n -> n + 3)
                .collect(Collectors.toList())); // [1, 4, 7, 10]
    }
}
```

설명:

- 접두 구간 처리, 조건 기반 iterate가 쉬워짐
- 실시간 스트림 처리 코드 표현력 개선

### 4-5. Optional 개선

```java
import java.util.Optional;

public class OptionalEnhancementExample {
    public static void main(String[] args) {
        Optional<String> primary = Optional.empty();
        Optional<String> fallback = Optional.of("default-user");

        String value = primary.or(() -> fallback).orElse("guest");
        System.out.println(value);

        primary.ifPresentOrElse(
                System.out::println,
                () -> System.out.println("primary is empty")
        );
    }
}
```

설명:

- 빈 값 대체 로직을 체이닝으로 명확히 표현 가능
- `ifPresentOrElse`로 분기 가독성 향상

### 4-6. 인터페이스 private 메서드

```java
interface AuditLogger {
    default void info(String message) {
        log("INFO", message);
    }

    default void warn(String message) {
        log("WARN", message);
    }

    private void log(String level, String message) {
        System.out.println("[" + level + "] " + message);
    }
}

public class PrivateMethodInInterfaceExample implements AuditLogger {
    public static void main(String[] args) {
        PrivateMethodInInterfaceExample app = new PrivateMethodInInterfaceExample();
        app.info("service started");
        app.warn("high latency");
    }
}
```

설명:

- 인터페이스 내부 중복 구현을 숨겨서 유지보수성 개선

### 4-7. Try-with-resources 개선

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;

public class TryWithResourcesExample {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new StringReader("hello"));

        try (reader) {
            System.out.println(reader.readLine());
        }
    }
}
```

설명:

- Java 8에서는 `try (...)` 안에서 새 변수를 선언해야 했지만,
  Java 9부터 effectively final 리소스를 직접 넣을 수 있습니다.

### 4-8. Process API (`ProcessHandle`)

```java
public class ProcessHandleExample {
    public static void main(String[] args) {
        ProcessHandle current = ProcessHandle.current();

        System.out.println("pid=" + current.pid());
        current.info().command().ifPresent(cmd -> System.out.println("command=" + cmd));

        long childCount = current.children().count();
        System.out.println("children=" + childCount);
    }
}
```

설명:

- 프로세스 상태 조회, 부모/자식 관계 추적, 종료 감지 로직을 표준 API로 처리 가능

## 5) 이전 버전(Java 8)과 차이점

| 비교 항목 | Java 8 | Java 9 |
|---|---|---|
| 플랫폼 구조 | 클래스패스 중심 | 모듈 경계 기반(강한 캡슐화) |
| 컬렉션 생성 | `Arrays.asList`/직접 빌드 | `List.of`, `Set.of`, `Map.of` |
| Optional | 기본 연산 중심 | 대체/분기 API 강화 |
| Stream | 기본 파이프라인 | 구간 처리 메서드 추가 |
| 개발 도구 | IDE/빌드 중심 | JShell로 빠른 실험 가능 |

핵심 정리:

- Java 8이 "코딩 스타일"을 바꿨다면,
- Java 9은 "애플리케이션 구조와 의존성 관리 방식"을 바꿨습니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| 모듈화 전략 | 한 번에 분리하지 말고 패키지 단위로 점진 적용 |
| 라이브러리 호환 | reflection 의존 프레임워크의 Java 9 대응 여부 확인 |
| 빌드 스크립트 | Maven/Gradle에서 module path 설정 검토 |
| 배포 환경 | JVM 옵션(`--add-opens` 등) 최소화 전략 수립 |
| 코드 가이드 | 컬렉션 팩토리/Optional/Stream 확장 메서드 사용 기준 수립 |

## 마무리

Java 9은 Java 8 기반 코드에 모듈 경계와 운영 안정성 관점을 추가한 버전입니다.
다음 글(Java 10)에서는 `var` 중심의 문법 변화와 릴리스 주기 안정화 관점에서 이어서 정리하겠습니다.
