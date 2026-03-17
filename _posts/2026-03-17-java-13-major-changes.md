---
layout: post
title: "Java 13 주요 변경사항"
date: 2026-03-17 00:00:00 +0900
categories: [Java]
tags: [java, java-13, release-notes, switch-expression, text-blocks, zgc]
permalink: /java/java-13-major-changes/
---

## 개요

Java 13은 **2019년 9월**에 출시된 비LTS(단기 지원) 릴리스입니다.
Java 12에서 시작된 언어 실험 기능이 정제되었고, 런타임 측면에서는 ZGC와 CDS 관련 개선이 추가되어
"개발 문법 + 실행 환경" 양쪽 모두를 다듬는 역할을 했습니다.

이 글은 Java 13의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 12)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 13 |
| 출시년도 | 2019년 |
| 릴리스 성격 | 단기 릴리스(비LTS), Preview 기능 정제 + 런타임 개선 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| Switch Expression (2nd Preview) | `yield` 중심으로 문법 정리 | 분기식 코드 안정성/가독성 향상 |
| Text Blocks (Preview) | 여러 줄 문자열을 읽기 쉽게 작성 | SQL/JSON/HTML 템플릿 가독성 개선 |
| Dynamic CDS Archives | 애플리케이션 종료 시점에 동적 아카이브 생성 가능 | 재시작 성능 최적화 실험 용이 |
| ZGC: Uncommit Unused Memory | 사용하지 않는 힙 메모리 반환 개선 | 메모리 피크 이후 리소스 회수 효과 |
| Legacy Socket API 재구현 | `java.net.Socket` 내부 구현 정비 | 네트워크 안정성/유지보수성 개선 |

## 3) 대표 기능 설명

### Text Blocks (Preview)

Java 13에서 실무 체감이 큰 기능은 **Text Blocks(미리보기)** 입니다.
기존 Java 문자열은 줄바꿈과 따옴표 이스케이프가 많아 SQL/JSON/HTML 템플릿 가독성이 떨어졌는데,
Text Blocks를 쓰면 멀티라인 문자열을 원문에 가깝게 작성할 수 있습니다.

적용 포인트:

- SQL, JSON, HTML, GraphQL 같은 멀티라인 텍스트에 우선 적용
- 문자열 연결(`+`) 제거로 코드리뷰 비용 감소
- Java 13에서는 Preview 기능이므로 빌드 옵션 관리 필요

## 4) 변경사항별 예시

### 4-1. Switch Expression (`yield`) 정제

```java
public class SwitchExpressionJava13 {
    enum Grade { A, B, C, D }

    public static void main(String[] args) {
        Grade grade = Grade.B;

        String result = switch (grade) {
            case A:
                yield "excellent";
            case B:
                yield "good";
            case C:
                yield "pass";
            default:
                yield "retry";
        };

        System.out.println(result);
    }
}
```

설명:

- Java 13에서는 `break value` 대신 `yield`로 반환 의미를 명확히 표현
- 분기 로직이 길어져도 반환 지점을 파악하기 쉬움

### 4-2. Text Blocks 기본 사용

```java
public class TextBlockJsonExample {
    public static void main(String[] args) {
        String json = """
                {
                  "service": "billing",
                  "version": 13,
                  "enabled": true
                }
                """;

        System.out.println(json);
    }
}
```

설명:

- 이스케이프(`\"`, `\n`)를 줄여 가독성 향상
- API 테스트용 payload를 코드에 유지할 때 특히 편리

### 4-3. Text Blocks + SQL 템플릿

```java
public class TextBlockSqlExample {
    public static void main(String[] args) {
        String sql = """
                SELECT id, name, created_at
                FROM users
                WHERE status = ?
                ORDER BY created_at DESC
                """;

        System.out.println(sql);
    }
}
```

설명:

- 기존 `"SELECT ..." +` 연결 패턴보다 수정/리뷰가 쉬움
- 쿼리 라인 정렬과 들여쓰기 유지가 수월

### 4-4. Preview 기능 컴파일/실행 (Switch, Text Blocks)

```text
# 컴파일
javac --enable-preview --release 13 TextBlockJsonExample.java SwitchExpressionJava13.java

# 실행
java --enable-preview TextBlockJsonExample
java --enable-preview SwitchExpressionJava13
```

설명:

- Java 13의 switch expression/text blocks는 preview이므로 옵션 필수
- CI에서 `--enable-preview` 누락 시 빌드 실패 가능

### 4-5. Dynamic CDS 아카이브 생성 예시

```text
# 앱 실행 중 동적 CDS 아카이브 덤프
java -XX:ArchiveClassesAtExit=app-dynamic.jsa -jar app.jar

# 다음 실행에서 사용
java -XX:SharedArchiveFile=app-dynamic.jsa -jar app.jar
```

설명:

- 워밍된 클래스 로딩 패턴을 아카이브로 재사용 가능
- 재시작이 잦은 서비스/툴에서 시작 지연 감소 기대

### 4-6. ZGC 메모리 반환 확인 예시

```text
java -XX:+UnlockExperimentalVMOptions -XX:+UseZGC -Xms2g -Xmx2g -Xlog:gc*=info -jar app.jar
```

설명:

- 트래픽 급증 후 유휴 상태로 돌아가는 워크로드에서 메모리 회수 효과 관찰 가능
- 운영 적용 전 GC 로그와 컨테이너 RSS 지표를 함께 비교 권장

### 4-7. 소켓 구현 변경 영향 점검 포인트

```text
# 네트워크 디버깅 로그 예시
java -Djava.net.debug=all -jar app.jar
```

설명:

- 내부 구현 정비로 동작은 동일 API를 유지하지만, 경계 환경에서 회귀 테스트가 중요
- 프록시, 타임아웃, keep-alive 관련 통합 테스트를 권장

### 4-8. Text Blocks로 HTML 템플릿 구성

```java
public class TextBlockHtmlExample {
    public static void main(String[] args) {
        String html = """
                <section>
                  <h1>Java 13</h1>
                  <p>Text Blocks preview</p>
                </section>
                """;

        System.out.println(html);
    }
}
```

설명:

- 이메일/템플릿 문자열 작성 시 구조가 한눈에 보임
- 문자열 오타 수정 시간이 줄어드는 편

## 5) 이전 버전(Java 12)과 차이점

| 비교 항목 | Java 12 | Java 13 |
|---|---|---|
| Switch Expression | 1차 Preview | 2차 Preview + `yield` 정제 |
| 문자열 처리 | 기존 문자열 문법 중심 | Text Blocks Preview로 멀티라인 개선 |
| CDS | 기본/정적 활용 중심 | Dynamic CDS 아카이브 생성 강화 |
| GC/메모리 | G1 메모리 반환 개선 | ZGC 메모리 반환 개선 포함 |
| 네트워크 | 기존 구현 유지 | Legacy Socket API 재구현 |

핵심 정리:

- Java 12가 기능 "도입"에 초점이었다면,
- Java 13은 문법/런타임을 실전 친화적으로 "정제"한 릴리스입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| Preview 기능 관리 | `--enable-preview`를 로컬/CI/IDE에 일관되게 설정 |
| 텍스트 템플릿 리팩터링 | SQL/JSON/HTML 문자열 연결 코드를 Text Blocks 후보로 식별 |
| GC 지표 비교 | Java 12 대비 pause time, RSS, 처리량 변화 측정 |
| 네트워크 회귀 테스트 | 소켓/프록시/타임아웃/연결 재시도 시나리오 점검 |
| 배포 전략 | 비LTS 특성상 운영 고정 버전 여부를 팀 정책으로 명확화 |

## 마무리

Java 13은 "새 기능 추가"보다는 "실제로 쓰기 편하게 다듬는 단계"에 가까운 버전입니다.
다음 글(Java 14)에서는 switch expression 정식화와 records/instanceof 패턴 매칭(Preview) 중심으로 이어서 정리하겠습니다.
