---
layout: post
title: "Java 14 주요 변경사항"
date: 2026-03-19 00:00:00 +0900
categories: [Java]
tags: [java, java-14, release-notes, records, pattern-matching, switch-expressions]
permalink: /java/java-14-major-changes/
---

## 개요

Java 14는 **2020년 3월**에 출시된 비LTS(단기 지원) 릴리스입니다.
Java 12~13에서 미리보기로 제공되던 언어 기능이 정식화되거나 다음 단계로 진화했고,
운영 측면에서는 NPE 진단 개선, 패키징 도구 강화 등 실무 체감 포인트가 함께 추가되었습니다.

이 글은 Java 14의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 13)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 14 |
| 출시년도 | 2020년 |
| 릴리스 성격 | 단기 릴리스(비LTS), 언어 기능 정식화 + 진단/패키징 개선 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| Switch Expressions (정식) | `switch`를 식으로 안정적으로 사용 가능 | 분기 반환 코드 표준화 |
| Records (Preview) | 데이터 중심 클래스를 간결하게 선언 | DTO/응답 모델 보일러플레이트 감소 |
| Pattern Matching for `instanceof` (Preview) | 타입 검사 + 캐스팅 결합 | 조건문 가독성 향상 |
| Helpful NullPointerExceptions | NPE 발생 지점을 구체적으로 안내 | 장애 원인 파악 시간 단축 |
| `jpackage` (Incubator) | 플랫폼별 설치 패키지 생성 지원 | 데스크톱/배포형 앱 패키징 단순화 |
| Text Blocks (2nd Preview) | 멀티라인 문자열 기능 추가 보완 | SQL/JSON/HTML 문자열 유지보수 개선 |
| CMS GC 제거 | 오래된 GC 제거로 옵션 정리 | JVM 옵션 호환성 점검 필요 |

## 3) 대표 기능 설명

### Switch Expressions 정식화

Java 14에서는 switch expression이 **정식 기능**으로 확정되었습니다.
이제 preview 플래그 없이 분기 결과를 값으로 반환하는 패턴을 안정적으로 사용할 수 있습니다.

적용 포인트:

- 상태 코드/권한/등급 분기처럼 결과 반환형 분기에 적극 적용
- `if-else` 연쇄를 `switch` 표현식으로 치환해 가독성 향상
- 팀 코드 컨벤션에 `switch` expression 사용 기준 반영 권장

## 4) 변경사항별 예시

### 4-1. Switch Expressions (정식)

```java
public class SwitchExpressionJava14 {
    enum Role { ADMIN, MEMBER, GUEST }

    public static void main(String[] args) {
        Role role = Role.MEMBER;

        String page = switch (role) {
            case ADMIN -> "admin-dashboard";
            case MEMBER -> "member-home";
            case GUEST -> "public-home";
        };

        System.out.println(page);
    }
}
```

설명:

- Java 14부터 preview 옵션 없이 사용 가능
- fall-through 위험이 낮고 반환값 의도가 분명

### 4-2. Records (Preview)

```java
public class RecordPreviewExample {
    public record UserSummary(Long id, String name, int age) {}

    public static void main(String[] args) {
        UserSummary user = new UserSummary(1L, "kim", 29);
        System.out.println(user.id());
        System.out.println(user.name());
        System.out.println(user.age());
    }
}
```

설명:

- `equals`, `hashCode`, `toString`, 접근자 메서드를 자동 제공
- 불변 데이터 모델 정의가 훨씬 간결해짐

### 4-3. `instanceof` Pattern Matching (Preview)

```java
public class InstanceOfPatternExample {
    public static void printLength(Object input) {
        if (input instanceof String text) {
            System.out.println(text.length());
        } else {
            System.out.println("not a string");
        }
    }

    public static void main(String[] args) {
        printLength("java14");
        printLength(100);
    }
}
```

설명:

- 기존 `instanceof` 검사 후 명시적 캐스팅 코드 제거
- 분기 내부 로직이 짧아지고 실수 가능성 감소

### 4-4. Preview 기능 컴파일/실행 (Records, Pattern Matching)

```text
# 컴파일
javac --enable-preview --release 14 RecordPreviewExample.java InstanceOfPatternExample.java

# 실행
java --enable-preview RecordPreviewExample
java --enable-preview InstanceOfPatternExample
```

설명:

- Java 14 기준 records/pattern matching은 preview
- CI/IDE 실행 옵션 누락 여부를 반드시 점검

### 4-5. Helpful NullPointerException

```java
public class HelpfulNpeExample {
    static class User {
        Profile profile;
    }

    static class Profile {
        String email;
    }

    public static void main(String[] args) {
        User user = new User();
        System.out.println(user.profile.email.length());
    }
}
```

설명:

- Java 14에서는 NPE 메시지가 더 구체적으로 표시되어
  어떤 참조 체인에서 null이 발생했는지 빠르게 파악 가능

### 4-6. `jpackage` 사용 예시

```text
jpackage \
  --name MyApp \
  --input target \
  --main-jar myapp.jar \
  --main-class com.example.Main \
  --type dmg
```

설명:

- OS별 설치 파일 생성(`dmg`, `msi`, `deb` 등)
- 데스크톱 배포형 앱의 패키징 스크립트를 표준화하기 쉬움

### 4-7. Text Blocks 활용 예시

```java
public class TextBlocksJava14 {
    public static void main(String[] args) {
        String query = """
                SELECT id, title, created_at
                FROM article
                WHERE status = 'PUBLISHED'
                ORDER BY created_at DESC
                """;

        System.out.println(query);
    }
}
```

설명:

- 멀티라인 문자열을 이스케이프 없이 작성 가능
- SQL/템플릿 수정 시 diff가 깔끔해짐

### 4-8. CMS 제거에 따른 옵션 점검

```text
# 기존에 CMS 사용하던 실행 옵션 예시(점검 대상)
java -XX:+UseConcMarkSweepGC -jar app.jar
```

설명:

- Java 14부터 CMS는 제거되어 해당 옵션 사용 시 실행 오류 가능
- G1, ZGC 등 대체 GC로 마이그레이션 필요

## 5) 이전 버전(Java 13)과 차이점

| 비교 항목 | Java 13 | Java 14 |
|---|---|---|
| Switch Expression | 2차 Preview | 정식 기능 |
| 데이터 모델 표현 | 일반 클래스/롬복 의존 빈번 | records(Preview)로 선언 간결화 |
| 타입 검사 | `instanceof` + 캐스팅 분리 | 패턴 매칭(Preview)로 결합 |
| 문자열 | Text Blocks Preview | Text Blocks 2차 Preview로 보완 |
| 운영 관점 | ZGC/CDS 보강 | NPE 진단, 패키징, GC 옵션 정리 강화 |

핵심 정리:

- Java 13이 미리보기 기능을 "다듬는" 단계였다면,
- Java 14는 일부 기능을 "실사용 가능 상태"로 끌어올린 전환점입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| switch 리팩터링 | `if-else`/구형 switch를 expression 형태로 치환 가능한지 검토 |
| preview 운영 정책 | records/pattern matching 사용 시 빌드 옵션 표준화 |
| 장애 대응 체계 | Helpful NPE 로그 수집/분석 파이프라인 반영 |
| 배포 자동화 | `jpackage` 도입 대상(데스크톱/배포형 앱) 식별 |
| JVM 옵션 점검 | CMS 옵션 잔존 여부 확인 및 대체 GC 전환 |

## 마무리

Java 14는 언어 사용성을 크게 개선하면서도 운영 현실에 필요한 진단/배포 포인트를 강화한 릴리스입니다.
다음 글(Java 15)에서는 text blocks 정식화, sealed classes(Preview), records 2차 preview를 중심으로 이어서 정리하겠습니다.
