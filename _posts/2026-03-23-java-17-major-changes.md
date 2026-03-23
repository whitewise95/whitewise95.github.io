---
layout: post
title: "Java 17 주요 변경사항"
date: 2026-03-23 00:00:00 +0900
categories: [Java]
tags: [java, java-17, release-notes, lts, sealed-classes, pattern-matching]
permalink: /java/java-17-major-changes/
---

## 개요

Java 17은 **2021년 9월**에 출시된 **LTS(장기 지원)** 버전입니다.
Java 11 이후의 주요 변화가 모여 안정화된 릴리스로,
실무에서 Java 11 → Java 17 업그레이드가 표준 경로로 자리 잡았습니다.

이 글은 Java 17의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 16)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 17 |
| 출시년도 | 2021년 |
| 릴리스 성격 | LTS, 언어 기능 정식화 + 운영 안정성 강화 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| LTS 릴리스 | 장기 지원 버전으로 안정성 확보 | 기업 표준 JDK 전환 가속 |
| Sealed Classes (정식) | 상속 가능한 하위 타입을 명시 제한 | 도메인 모델 안전성 강화 |
| Pattern Matching for `switch` (Preview) | switch에서 패턴 기반 분기 지원 | 복합 타입 분기 가독성 향상 |
| Strong Encapsulation (JEP 403) | 내부 JDK API 접근 강력 제한 | 레거시 리플렉션 의존 제거 필요 |
| New macOS Rendering Pipeline | Metal 기반 렌더링 파이프라인 | macOS UI/그래픽 성능 개선 |
| Foreign Function & Memory API (Incubator) | 네이티브 호출/메모리 접근 API 실험 | JNI 대체 경로 검토 가능 |
| Vector API (2nd Incubator) | SIMD 연산 API 개선 | 수치/미디어 처리 성능 최적화 실험 |
| Applet API 제거 예정 경고 강화 | 오래된 기술 제거 단계 진입 | 레거시 코드 정리 필요 |

## 3) 대표 기능 설명

### Sealed Classes 정식화

Java 17의 대표 기능은 **Sealed Classes 정식화**입니다.
도메인 모델에서 허용 가능한 하위 타입을 명시해,
컴파일 타임에 타입 확장 범위를 제어할 수 있습니다.

적용 포인트:

- 결제 상태, 주문 결과, 이벤트 타입처럼 닫힌 집합 모델에 적합
- 패턴 매칭/switch 분기와 함께 사용 시 유지보수성 향상
- 도메인 규칙을 타입 시스템으로 강제 가능

## 4) 변경사항별 예시

### 4-1. Sealed Classes (정식)

```java
public class SealedJava17Example {
    public static void main(String[] args) {
        PaymentResult result = new PaymentSuccess("approved");
        System.out.println(result.message());
    }
}

sealed interface PaymentResult permits PaymentSuccess, PaymentFailure {
    String message();
}

final class PaymentSuccess implements PaymentResult {
    private final String message;

    PaymentSuccess(String message) {
        this.message = message;
    }

    public String message() {
        return message;
    }
}

final class PaymentFailure implements PaymentResult {
    private final String message;

    PaymentFailure(String message) {
        this.message = message;
    }

    public String message() {
        return message;
    }
}
```

설명:

- 하위 타입 범위를 명시적으로 제한
- 비즈니스 규칙과 타입 구조를 일치시키기 쉬움

### 4-2. Pattern Matching for `switch` (Preview)

```java
public class SwitchPatternPreviewJava17 {
    public static String classify(Object value) {
        return switch (value) {
            case Integer i -> "int: " + i;
            case Long l -> "long: " + l;
            case String s -> "string length: " + s.length();
            case null -> "null";
            default -> "other";
        };
    }

    public static void main(String[] args) {
        System.out.println(classify("java17"));
        System.out.println(classify(7));
    }
}
```

설명:

- 타입별 분기 로직을 `switch`에서 직접 표현 가능
- Java 17에서는 preview이므로 옵션이 필요

### 4-3. Preview 기능 컴파일/실행 (switch pattern)

```text
# 컴파일
javac --enable-preview --release 17 SwitchPatternPreviewJava17.java

# 실행
java --enable-preview SwitchPatternPreviewJava17
```

설명:

- preview 기능은 로컬/CI/IDE 옵션 정합성이 중요
- 운영 코드 도입 전 팀 기준 합의 필요

### 4-4. Strong Encapsulation 대응 예시

```text
# 레거시 라이브러리 임시 대응 (권장: 장기적으로 제거)
java --add-opens java.base/java.lang=ALL-UNNAMED -jar app.jar
```

설명:

- Java 17에서 내부 API 접근 제한이 기본 강화
- 장기적으로는 표준 API/업데이트된 라이브러리로 이전 권장

### 4-5. Record + Sealed 조합 예시

```java
public class RecordWithSealedExample {
    sealed interface ApiResult permits Ok, Error {}

    record Ok(String value) implements ApiResult {}
    record Error(String reason) implements ApiResult {}

    public static void main(String[] args) {
        ApiResult result = new Ok("done");
        System.out.println(result);
    }
}
```

설명:

- Java 16의 records 정식화 + Java 17 sealed 정식화를 함께 활용
- API 응답 모델을 간결하고 안전하게 설계 가능

### 4-6. Foreign Function & Memory API (Incubator) 개념 예시

```java
// 개념 예시: jdk.incubator.foreign 모듈 사용
// 네이티브 함수 호출/JNI 대체 경로를 실험할 수 있는 API
```

설명:

- 고성능 네이티브 라이브러리 연동 시 JNI 대안 가능성
- 실험 기능이므로 버전/호환성 검증 필수

### 4-7. Vector API (2nd Incubator) 개념 예시

```java
// 개념 예시: jdk.incubator.vector 패키지
// 데이터 병렬 연산(SIMD)을 자바 코드로 표현
```

설명:

- 영상/통계/암호화 등 수치 연산 워크로드에서 유효
- 마이크로벤치마크로 실제 이득 측정 필요

### 4-8. 마이그레이션 빌드 확인 포인트

```text
# Maven/Gradle 빌드 JDK 확인
java -version
javac -version
```

설명:

- 로컬/CI/배포 환경 JDK 버전 불일치가 가장 흔한 실패 원인
- 라이브러리 호환성(특히 리플렉션/바이트코드 조작) 사전 점검 필수

## 5) 이전 버전(Java 16)과 차이점

| 비교 항목 | Java 16 | Java 17 |
|---|---|---|
| 릴리스 성격 | 비LTS | LTS |
| Sealed Classes | 2차 Preview | 정식 기능 |
| Switch 패턴 분기 | 미지원 | Preview 도입 |
| 캡슐화 정책 | 강화 시작 | 강한 캡슐화 기본화 |
| 조직 채택 관점 | 실험/전환 단계 | 장기 운영 기준 버전 |
| 생태계 영향 | 기능 성숙 | 라이브러리/JDK17 대응 본격화 |

핵심 정리:

- Java 16이 기능 완성도를 높인 단계라면,
- Java 17은 장기 운영 기준으로 채택할 수 있는 안정 릴리스입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| JDK 통일 | 개발/테스트/운영 JDK를 Java 17로 일관화 |
| 라이브러리 호환성 | 리플렉션/바이트코드 라이브러리(Jackson, ByteBuddy 등) 점검 |
| JVM 옵션 정리 | `--add-opens` 사용 항목 최소화 및 제거 계획 수립 |
| 도메인 모델 개선 | sealed + records 적용 가능한 모델 식별 |
| CI 파이프라인 | Java 17 기준 테스트/빌드/배포 스크립트 정비 |

## 마무리

Java 17은 Java 생태계에서 "현실적인 장기 표준"으로 자리 잡은 핵심 LTS 버전입니다.
다음 글(Java 18)에서는 LTS 이후 실험 기능 흐름과 성능/생산성 보강 포인트를 중심으로 이어서 정리하겠습니다.
