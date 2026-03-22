---
layout: post
title: "Java 16 주요 변경사항"
date: 2026-03-22 00:00:00 +0900
categories: [Java]
tags: [java, java-16, release-notes, records, pattern-matching, jpackage]
permalink: /java/java-16-major-changes/
---

## 개요

Java 16은 **2021년 3월**에 출시된 비LTS(단기 지원) 릴리스입니다.
Java 14~15에서 preview로 검증되던 기능이 정식화되면서,
언어 표현력과 런타임 운영 안정성을 동시에 끌어올린 버전입니다.

이 글은 Java 16의 핵심 변경사항을 실무 기준으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 15)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 16 |
| 출시년도 | 2021년 |
| 릴리스 성격 | 단기 릴리스(비LTS), preview 기능 정식화 + 캡슐화 강화 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| Records (정식) | 데이터 클래스 문법 정식화 | DTO/응답 모델 코드량 감소 |
| Pattern Matching for `instanceof` (정식) | 타입 검사 + 캐스팅 통합 정식화 | 조건 분기 가독성 향상 |
| `jpackage` (정식) | 앱 패키징 도구 정식 제공 | 설치형 배포 자동화 용이 |
| Strong Encapsulation 강화 | JDK 내부 API 접근 기본 차단 강화 | 레거시 리플렉션 코드 점검 필요 |
| Sealed Classes (2nd Preview) | 상속 제한 모델 보완 | 도메인 타입 안정성 설계 강화 |
| Vector API (Incubator) | SIMD 연산 API 실험 제공 | 고성능 계산 로직 최적화 실험 가능 |
| Unix-Domain Socket Channels | 로컬 IPC 채널 표준 지원 | 같은 호스트 프로세스 통신 성능 개선 |
| Elastic Metaspace | 메타스페이스 메모리 반환 개선 | 장기 실행 서비스 메모리 효율 개선 |

## 3) 대표 기능 설명

### Records 정식화

Java 16의 대표 기능은 **Records 정식화**입니다.
불변 데이터 전달 객체를 위한 표준 문법이 확정되면서,
기존 POJO/롬복 중심의 보일러플레이트 코드를 크게 줄일 수 있습니다.

적용 포인트:

- 조회 응답 DTO, 이벤트 페이로드, 설정 값 객체에 우선 적용
- 생성자/접근자/`equals`/`hashCode`/`toString` 자동 생성 활용
- 엔티티처럼 변경 가능한 객체에는 기존 클래스 모델 유지

## 4) 변경사항별 예시

### 4-1. Records (정식)

```java
public class RecordJava16Example {
    public record UserSummary(Long id, String name, String email) {}

    public static void main(String[] args) {
        UserSummary user = new UserSummary(1L, "kim", "kim@example.com");
        System.out.println(user);
        System.out.println(user.name());
    }
}
```

설명:

- Java 16부터 preview 옵션 없이 records 사용 가능
- 데이터 전달용 타입 설계 속도와 일관성이 좋아짐

### 4-2. `instanceof` Pattern Matching (정식)

```java
public class PatternMatchingJava16 {
    public static void printUpper(Object value) {
        if (value instanceof String text) {
            System.out.println(text.toUpperCase());
        } else {
            System.out.println("not string");
        }
    }

    public static void main(String[] args) {
        printUpper("java16");
        printUpper(10);
    }
}
```

설명:

- 명시적 캐스팅 제거로 분기 코드가 단순해짐
- 실수로 잘못 캐스팅하는 위험 감소

### 4-3. `jpackage` 정식 사용 예시

```text
jpackage \
  --name MyDesktopApp \
  --input build/libs \
  --main-jar app.jar \
  --main-class com.example.Main \
  --type msi
```

설명:

- OS 배포 패키지(`msi`, `dmg`, `pkg`, `deb`, `rpm`) 생성 지원
- 배포 파이프라인에서 설치형 아티팩트 자동 생성 가능

### 4-4. Sealed Classes (2nd Preview)

```java
public class SealedPreviewJava16 {
    public static void main(String[] args) {
        Result result = new Success("ok");
        System.out.println(result.message());
    }
}

sealed interface Result permits Success, Failure {
    String message();
}

final class Success implements Result {
    private final String message;

    Success(String message) {
        this.message = message;
    }

    public String message() {
        return message;
    }
}

final class Failure implements Result {
    private final String message;

    Failure(String message) {
        this.message = message;
    }

    public String message() {
        return message;
    }
}
```

설명:

- 허용된 하위 타입만 명시적으로 관리 가능
- 상태 모델/결과 모델을 안전하게 표현할 수 있음

### 4-5. Strong Encapsulation 점검 예시

```text
# 내부 JDK API 접근이 필요한 레거시 라이브러리 실행 시 임시 대응 예시
java --add-opens java.base/java.lang=ALL-UNNAMED -jar app.jar
```

설명:

- Java 16에서는 내부 API 접근이 더 엄격하게 제한됨
- 장기적으로는 `--add-opens` 의존을 줄이고 표준 API로 이전 필요

### 4-6. Unix-Domain Socket Channels 예시

```java
import java.net.StandardProtocolFamily;
import java.net.UnixDomainSocketAddress;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;

public class UnixDomainSocketClientExample {
    public static void main(String[] args) throws Exception {
        UnixDomainSocketAddress address = UnixDomainSocketAddress.of("/tmp/app.sock");
        try (SocketChannel channel = SocketChannel.open(StandardProtocolFamily.UNIX)) {
            channel.connect(address);
            channel.write(StandardCharsets.UTF_8.encode("ping"));
        }
    }
}
```

설명:

- 같은 서버 내 프로세스 간 통신에서 TCP 대비 오버헤드 절감 가능
- 로컬 IPC 기반 아키텍처에서 유용

### 4-7. Vector API (Incubator) 사용 예시

```java
// 개념 예시: Vector API는 모듈/옵션 설정이 필요할 수 있음
// jdk.incubator.vector 패키지를 활용해 SIMD 병렬 연산을 표현
```

설명:

- 이미지/수치 계산 등 데이터 병렬 처리에서 성능 최적화 가능성
- 실험적 기능이므로 벤치마크 기반 검증 필요

### 4-8. Elastic Metaspace 관찰 예시

```text
java -Xlog:gc+metaspace=info -jar app.jar
```

설명:

- 클래스 로딩/언로딩이 많은 장기 실행 서비스에서 메모리 효율 개선 기대
- 업그레이드 전후 메타스페이스 사용량 비교 권장

## 5) 이전 버전(Java 15)과 차이점

| 비교 항목 | Java 15 | Java 16 |
|---|---|---|
| Records | 2차 Preview | 정식 기능 |
| Pattern Matching (`instanceof`) | 2차 Preview | 정식 기능 |
| `jpackage` | Incubator 단계 | 정식 기능 |
| 캡슐화 정책 | 점진 강화 | 강한 캡슐화 기본값 강화 |
| IPC 기능 | 별도 구현 중심 | Unix-domain socket 채널 표준 제공 |
| 메모리 관리 | 일반 메타스페이스 정책 | Elastic metaspace 개선 |

핵심 정리:

- Java 15가 기능 정식화의 "예고편"이었다면,
- Java 16은 실제 운영 코드에 바로 반영 가능한 "정식 도입판"에 가깝습니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| DTO 모델 전환 | records로 치환 가능한 타입 식별 및 점진 이전 |
| 분기 코드 개선 | `instanceof + cast` 패턴을 정식 패턴 매칭으로 치환 |
| 배포 자동화 | `jpackage` 기반 설치 파일 생성 파이프라인 구축 검토 |
| 리플렉션 의존성 | `--add-opens` 필요 라이브러리 목록화 및 대체 API 검토 |
| 성능/메모리 검증 | metaspace/IPC/GC 지표를 버전 전환 전후 비교 |

## 마무리

Java 16은 언어 기능의 완성도와 운영 안정성을 함께 강화한 버전입니다.
다음 글(Java 17)에서는 LTS 전환 포인트와 sealed classes 정식화, 패턴 매칭 확장 방향을 중심으로 이어서 정리하겠습니다.
