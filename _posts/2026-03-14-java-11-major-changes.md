---
layout: post
title: "Java 11 주요 변경사항"
date: 2026-03-14 00:00:00 +0900
categories: [Java]
tags: [java, java-11, release-notes, lts, http-client]
permalink: /java/java-11-major-changes/
---

## 개요

Java 11은 **2018년 9월**에 출시된 버전으로, Java 8 이후 현업에서 가장 널리 채택된 장기 지원 버전 중 하나입니다.
Java 9, 10에서 도입된 변화가 실전 운영 단계로 정리되었고, 표준 HTTP Client와 문자열 API 개선처럼 개발자가 바로 체감할 수 있는 기능도 추가됐습니다.

이 글은 Java 11의 핵심 변경사항을 실무 기준으로 빠르게 파악할 수 있도록 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. Java 10 대비 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 11 |
| 출시년도 | 2018년 |
| 릴리스 성격 | LTS 전환 + 표준 라이브러리 성숙 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| LTS 릴리스 | 장기 지원 버전으로 안정성 확보 | 기업 표준 JDK 채택 증가 |
| 표준 HTTP Client | `java.net.http` 정식 도입 | 외부 HTTP 라이브러리 의존 축소 |
| 문자열 API 강화 | `isBlank`, `lines`, `repeat`, `strip` 추가 | 문자열 처리 코드 간결화 |
| 파일 API 개선 | `Files.readString`, `writeString` 추가 | 파일 입출력 코드 축소 |
| 컬렉션/람다 보강 | `Predicate.not` 등 사용성 향상 | Stream 체인 가독성 개선 |
| 단일 파일 실행 | `java Hello.java` 지원 | 스크립트성 실행과 학습 생산성 향상 |
| 저지연 GC 확장 | ZGC, Epsilon GC 등 옵션 확장 | 성능 실험 및 운영 선택지 증가 |
| TLS/보안 정비 | 오래된 암호화 알고리즘 정리 | 보안 기준 상향 대응 필요 |

## 3) 대표 기능 설명

### 표준 HTTP Client

Java 11의 대표 기능은 `java.net.http` 패키지입니다.
기존에는 Apache HttpClient, OkHttp 같은 외부 라이브러리에 크게 의존했지만, Java 11부터는 HTTP/2와 비동기 요청을 지원하는 표준 클라이언트를 기본 제공하게 됐습니다.

적용 포인트:

- 신규 프로젝트는 표준 HTTP Client를 우선 검토
- 동기/비동기 호출 패턴을 같은 API 계열로 통합 가능
- 기존 외부 라이브러리 제거 시 리트라이, 인터셉터 같은 부가 기능은 별도 판단 필요

## 4) 변경사항별 예시

### 4-1. 표준 HTTP Client

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class HttpClientExample {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://example.com"))
                .GET()
                .build();

        HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println(response.statusCode());
        System.out.println(response.body());
    }
}
```

설명:

- HTTP/1.1, HTTP/2 지원
- 동기 `send`, 비동기 `sendAsync`를 같은 API에서 제공

### 4-2. 비동기 HTTP 호출

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.CompletableFuture;

public class AsyncHttpClientExample {
    public static void main(String[] args) {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://example.com"))
                .build();

        CompletableFuture<Void> future = client.sendAsync(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                )
                .thenApply(HttpResponse::body)
                .thenAccept(System.out::println);

        future.join();
    }
}
```

설명:

- Java 8의 `CompletableFuture`와 자연스럽게 결합
- 네트워크 I/O 비동기 처리 구조를 표준 라이브러리로 통일 가능

### 4-3. 문자열 API 강화

```java
public class StringApiExample {
    public static void main(String[] args) {
        String text = "  hello java 11  ";

        System.out.println(text.isBlank());
        System.out.println(text.strip());
        System.out.println("=".repeat(20));
        "a\nb\nc".lines().forEach(System.out::println);
    }
}
```

설명:

- `trim`보다 유니코드 친화적인 `strip`
- 줄 단위 처리와 반복 문자열 생성이 쉬워짐

### 4-4. 파일 API 개선

```java
import java.nio.file.Files;
import java.nio.file.Path;

public class FilesApiExample {
    public static void main(String[] args) throws Exception {
        Path path = Path.of("sample.txt");

        Files.writeString(path, "Java 11 file api");
        String content = Files.readString(path);

        System.out.println(content);
    }
}
```

설명:

- 짧은 텍스트 파일 처리에서 `BufferedReader`, `BufferedWriter` 보일러플레이트 감소

### 4-5. `Predicate.not`

```java
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;

public class PredicateNotExample {
    public static void main(String[] args) {
        List<String> values = List.of("java", "", "jdk", " ", "http");

        List<String> filtered = values.stream()
                .filter(Predicate.not(String::isBlank))
                .collect(Collectors.toList());

        System.out.println(filtered);
    }
}
```

설명:

- `s -> !s.isBlank()`보다 의도가 명확
- Stream 필터 체인을 읽기 쉽게 만듦

### 4-6. 단일 파일 실행

```text
# 컴파일 없이 바로 실행
java HelloJava11.java
```

```java
public class HelloJava11 {
    public static void main(String[] args) {
        System.out.println("Run without explicit javac");
    }
}
```

설명:

- 교육, 샘플 코드, 간단한 자동화 스크립트 작성에 유리

### 4-7. ZGC 사용 예시

```text
java -XX:+UnlockExperimentalVMOptions -XX:+UseZGC -Xms2g -Xmx2g -jar app.jar
```

설명:

- 저지연 GC 실험이 가능해짐
- 프로덕션 적용 전에는 pause time, throughput, 메모리 사용량을 함께 검증해야 함

### 4-8. 보안/TLS 변화 체크

```text
# 예시: 오래된 TLS/암호 스위트 의존 여부를 서버 연결 테스트로 점검
java -Djavax.net.debug=ssl -jar app.jar
```

설명:

- Java 11 업그레이드 시 구형 서버/레거시 인증서 체계와의 호환성 확인 필요
- 보안 강화는 장점이지만, 운영 환경에서는 사전 연결 테스트가 중요

## 5) 이전 버전(Java 10)과 차이점

| 비교 항목 | Java 10 | Java 11 |
|---|---|---|
| 핵심 초점 | `var`, 운영 최적화 | LTS 안정화 + 표준 API 확장 |
| 네트워크 | 외부 라이브러리 의존 빈번 | 표준 HTTP Client 사용 가능 |
| 문자열 처리 | 기존 유틸 조합 | `isBlank`, `lines`, `repeat`, `strip` 추가 |
| 파일 처리 | 기존 `Files` 조합 사용 | `readString`, `writeString` 단순화 |
| 채택 관점 | 단기 릴리스 | 장기 운영 기준 버전 |

핵심 정리:

- Java 10이 개발 편의와 런타임 개선 중심이었다면,
- Java 11은 그 위에 장기 운영 안정성과 표준 라이브러리 완성도를 더한 버전입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| JDK 표준화 | 개발/테스트/운영 환경을 Java 11로 통일할지 결정 |
| HTTP 호출 레이어 | 외부 HTTP 클라이언트 제거 가능성 검토 |
| 문자열/파일 유틸 | 자주 쓰는 유틸 메서드를 Java 11 표준 API로 치환 검토 |
| GC 실험 | G1, ZGC 후보에 대해 성능 테스트 수행 |
| 보안 호환성 | TLS, 인증서, 구형 서버 연결 여부 사전 점검 |

## 마무리

Java 11은 단순히 "다음 버전"이 아니라, 실제 운영 환경에서 기준점이 되는 LTS 버전입니다.
다음 글(Java 12)에서는 짧은 릴리스 주기 속에서 등장한 switch expression 미리보기와 언어 실험 기능을 중심으로 이어서 정리하겠습니다.
