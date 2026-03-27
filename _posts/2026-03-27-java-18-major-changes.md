---
layout: post
title: "Java 18 주요 변경사항"
date: 2026-03-27 00:00:00 +0900
categories: [Java]
tags: [java, java-18, release-notes, utf-8, web-server, javadoc]
permalink: /java/java-18-major-changes/
---

## 개요

Java 18은 **2022년 3월**에 출시된 비LTS(단기 지원) 릴리스입니다.
대규모 문법 변화보다는 개발 경험과 운영 기본값을 개선하는 데 초점이 맞춰졌고,
특히 UTF-8 기본 문자셋 전환과 간단한 HTTP 파일 서버 제공이 실무에서 체감 포인트였습니다.

이 글은 Java 18의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 17)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 18 |
| 출시년도 | 2022년 |
| 릴리스 성격 | 단기 릴리스(비LTS), 기본값/개발자 경험 개선 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| UTF-8 by Default | 기본 문자셋을 UTF-8로 통일 | OS별 인코딩 차이 버그 감소 |
| Simple Web Server | `jwebserver` 도구 제공 | 로컬 정적 파일 테스트 간소화 |
| JavaDoc Code Snippets | 문서 내 코드 스니펫 표준화 | API 문서 가독성/정확성 향상 |
| Core Reflection 재구현 | Method Handle 기반 내부 구현 개선 | 리플렉션 성능/유지보수성 개선 |
| Internet-Address Resolution SPI | DNS/이름 해석 확장 포인트 제공 | 네트워크 해석 정책 커스터마이징 가능 |
| Vector API (3rd Incubator) | SIMD API 개선 지속 | 고성능 연산 최적화 실험 지속 |
| Foreign Function & Memory API (2nd Incubator) | 네이티브 연동 API 개선 | JNI 대체 경로 연구 확장 |

## 3) 대표 기능 설명

### UTF-8 기본 문자셋 전환

Java 18의 대표 변화는 **기본 문자셋 UTF-8 통일**입니다.
기존에는 OS 기본 인코딩(예: 윈도우 CP949, 리눅스 UTF-8) 차이로
파일 입출력/로그/CSV 처리에서 환경별 버그가 발생하기 쉬웠습니다.

적용 포인트:

- 문자 인코딩을 명시하지 않은 레거시 코드 점검
- 멀티 OS 개발환경에서 재현되던 깨짐 이슈 감소 기대
- 외부 시스템 연동 시 인코딩 계약(UTF-8 여부) 명확화 필요

## 4) 변경사항별 예시

### 4-1. UTF-8 기본값 확인

```java
import java.nio.charset.Charset;

public class DefaultCharsetJava18 {
    public static void main(String[] args) {
        System.out.println(Charset.defaultCharset());
    }
}
```

설명:

- Java 18부터 기본값이 UTF-8로 통일
- 인코딩 의존 레거시 코드는 명시적 charset 지정 권장

### 4-2. 파일 읽기/쓰기 시 명시적 UTF-8

```java
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class Utf8FileExample {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("sample.txt");
        Files.writeString(path, "안녕하세요 Java 18", StandardCharsets.UTF_8);

        String text = Files.readString(path, StandardCharsets.UTF_8);
        System.out.println(text);
    }
}
```

설명:

- 기본값이 UTF-8이어도, 코드에서 charset 명시하면 의도가 분명
- 장기 유지보수 관점에서 명시적 인코딩이 안전

### 4-3. Simple Web Server 실행

```text
# 현재 디렉토리 정적 파일 서버 실행 (기본 포트 8000)
jwebserver

# 포트 지정
jwebserver --port 8080 --directory ./public
```

설명:

- 로컬 테스트/문서 미리보기/프런트 정적 파일 확인에 유용
- 프로덕션 서버 대체 용도가 아니라 개발 보조 도구 용도

### 4-4. JavaDoc 스니펫 예시

```java
/**
 * 사용자 이름을 대문자로 변환합니다.
 * {@snippet :
 * String input = "java";
 * String output = input.toUpperCase();
 * }
 */
public class JavadocSnippetExample {
    public String toUpper(String input) {
        return input.toUpperCase();
    }
}
```

설명:

- 문서 내 코드 예시를 구조적으로 관리 가능
- API 문서와 실제 코드의 동기화 품질 향상

### 4-5. Core Reflection 사용 예시

```java
import java.lang.reflect.Method;

public class ReflectionJava18Example {
    public static class UserService {
        public String hello(String name) {
            return "Hello, " + name;
        }
    }

    public static void main(String[] args) throws Exception {
        UserService service = new UserService();
        Method method = UserService.class.getMethod("hello", String.class);
        Object result = method.invoke(service, "Java18");
        System.out.println(result);
    }
}
```

설명:

- API 사용법은 기존과 동일하나 내부 구현이 개선됨
- 프레임워크 리플렉션 성능/안정성 측면에서 긍정적 영향 기대

### 4-6. Address Resolution SPI 개념 예시

```java
// 개념 예시: java.net.spi.InternetAddressResolverProvider
// 커스텀 DNS/주소 해석 전략이 필요한 환경에서 확장 가능
```

설명:

- 사내 DNS 정책/테스트 환경에서 이름 해석 전략 커스터마이징 가능
- 일반 애플리케이션은 기본 구현 사용이 보통

### 4-7. Vector API (3rd Incubator) 개념 예시

```java
// 개념 예시: jdk.incubator.vector 패키지
// 데이터 병렬 연산 성능 최적화 시 사용
```

설명:

- 대량 수치 연산 워크로드에서 SIMD 최적화 가능성
- 벤치마크 기반으로 이득 검증 필요

### 4-8. FFM API (2nd Incubator) 개념 예시

```java
// 개념 예시: jdk.incubator.foreign 패키지
// JNI 없이 네이티브 함수/메모리 접근을 실험 가능
```

설명:

- 네이티브 연동 성능/안전성 개선 방향의 핵심 실험 기능
- 실무 도입 전 버전 호환성과 안정성 검증 필요

## 5) 이전 버전(Java 17)과 차이점

| 비교 항목 | Java 17 | Java 18 |
|---|---|---|
| 릴리스 성격 | LTS, 장기 운영 기준 | 비LTS, 개선 사항 빠른 반영 |
| 핵심 포인트 | sealed classes 정식, 캡슐화 강화 | UTF-8 기본화, 개발 보조 도구 강화 |
| 운영 이슈 | JDK17 호환성 전환 | 인코딩 차이 버그 감소, 로컬 개발 생산성 향상 |
| 문서화/DX | 기존 JavaDoc 흐름 | snippet 태그로 문서 품질 개선 |
| 실험 API | switch pattern preview 등 | vector/FFM 개선 지속 |

핵심 정리:

- Java 17이 장기 운영 기준을 세우는 버전이라면,
- Java 18은 개발 경험과 기본값을 다듬어 실무 효율을 높이는 버전입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| 인코딩 점검 | 파일/로그/배치 처리 코드의 charset 명시 여부 검토 |
| 로컬 툴 활용 | `jwebserver`를 개발/테스트 파이프라인 보조 도구로 활용 검토 |
| 문서 품질 개선 | JavaDoc에 snippet 태그 적용 가능 영역 식별 |
| 리플렉션/네트워크 | 프레임워크 및 DNS 확장 포인트 사용 여부 점검 |
| 실험 API 정책 | vector/FFM 사용 시 버전 고정 및 검증 전략 수립 |

## 마무리

Java 18은 큰 문법 변화보다 개발자 경험을 개선하는 "실전형 릴리스"에 가깝습니다.
다음 글(Java 19)에서는 가상 스레드(Preview), 구조화 동시성(Incubator), 레코드 패턴(Preview) 흐름을 중심으로 이어서 정리하겠습니다.
