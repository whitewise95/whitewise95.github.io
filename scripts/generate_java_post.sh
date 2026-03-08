#!/usr/bin/env bash
set -euo pipefail

POST_DIR="_posts"
TZ_NAME="Asia/Seoul"
TODAY="$(TZ="$TZ_NAME" date +%F)"

VERSIONS=(8 9 10 11 12 13 14 15 16 17 18 19 20 21)

created="false"
completed="false"
created_version=""

mkdir -p "$POST_DIR"

if ls "$POST_DIR"/"$TODAY"-java-*-major-changes.md >/dev/null 2>&1; then
  echo "A Java post already exists for $TODAY. Skipping to keep one post per day."
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    {
      echo "created=false"
      echo "completed=false"
      echo "version="
    } >> "$GITHUB_OUTPUT"
  fi
  exit 0
fi

next_version=""
for v in "${VERSIONS[@]}"; do
  if ! ls "$POST_DIR"/*-java-"$v"-major-changes.md >/dev/null 2>&1; then
    next_version="$v"
    break
  fi
done

if [[ -z "$next_version" ]]; then
  echo "All Java 8-21 posts are already generated."
  completed="true"
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    {
      echo "created=false"
      echo "completed=true"
      echo "version="
    } >> "$GITHUB_OUTPUT"
  fi
  exit 0
fi

prev_version="$(($next_version - 1))"

case "$next_version" in
  8)
    release_year="2014"
    summary_table="| 항목 | 내용 |\n|---|---|\n| 함수형 프로그래밍 | Lambda 표현식과 메서드 레퍼런스로 컬렉션 처리 코드를 간결화 |\n| 컬렉션 처리 | Stream API로 filter-map-reduce 패턴 표준화 |\n| 인터페이스 확장 | default/static 메서드로 하위 호환성 유지하며 기능 추가 가능 |\n| 날짜/시간 API | `java.time` 도입으로 불변 객체 기반 날짜 처리 제공 |\n| 병렬 처리 | Parallel Stream과 `CompletableFuture`로 비동기 코드 단순화 |"
    representative_feature="Lambda + Stream API"
    representative_desc="Java 8은 객체지향 중심 코드에 함수형 스타일을 본격적으로 결합했습니다. 컬렉션 루프를 선언형 파이프라인으로 바꾸면서, 가독성과 유지보수성이 크게 개선되었습니다."
    code_example='```java
import java.util.List;

public class Java8Example {
    public static void main(String[] args) {
        List<String> names = List.of("alice", "bob", "andrew", "anna");

        long count = names.stream()
                .filter(name -> name.startsWith("a"))
                .map(String::toUpperCase)
                .peek(System.out::println)
                .count();

        System.out.println("Count = " + count);
    }
}
```'
    diff_text="Java 7까지는 익명 클래스와 반복문 중심 코드가 많았지만, Java 8부터는 함수형 추상화가 표준으로 자리잡았습니다. 특히 API 설계 시 `Stream`, `Optional`, `java.time`을 기본 전제로 보는 관점 변화가 가장 큽니다."
    ;;
  9)
    release_year="2017"
    summary_table="| 항목 | 내용 |\n|---|---|\n| 모듈 시스템 | Jigsaw(`module-info.java`)로 런타임/컴파일 의존성 명시 |\n| REPL 도구 | JShell 추가로 스크립트형 실험과 학습 생산성 향상 |\n| 컬렉션 팩토리 | `List.of`, `Set.of`, `Map.of`로 불변 컬렉션 생성 간소화 |\n| 스트림 개선 | `takeWhile`, `dropWhile`, `iterate` 오버로드 추가 |\n| Optional 개선 | `ifPresentOrElse`, `or`, `stream` 추가 |"
    representative_feature="Java Platform Module System (JPMS)"
    representative_desc="대규모 모놀리식 애플리케이션의 의존성 경계를 언어/플랫폼 레벨에서 관리할 수 있게 되었습니다. 내부 API 노출을 제한하고, 강한 캡슐화를 적용할 수 있습니다."
    code_example='```java
module com.example.app {
    requires java.sql;
    exports com.example.api;
}
```'
    diff_text="Java 8이 언어 생산성을 끌어올린 릴리스였다면, Java 9는 플랫폼 구조를 재정의한 릴리스입니다. 애플리케이션 아키텍처 차원에서 모듈 경계를 설계해야 한다는 점이 핵심 차이입니다."
    ;;
  10)
    release_year="2018"
    summary_table="| 항목 | 내용 |\n|---|---|\n| 지역 변수 타입 추론 | `var` 도입으로 로컬 변수 선언 간결화 |\n| GC 개선 | G1의 병렬 Full GC로 정지 시간 개선 |\n| 컨테이너 인식 | cgroup 기반 자원 인식 강화 |\n| AppCDS 확장 | 클래스 데이터 공유로 시작 시간 최적화 |\n| 릴리스 모델 | 6개월 주기 릴리스 안정화 |"
    representative_feature="var (Local Variable Type Inference)"
    representative_desc="장황한 제네릭 타입 선언을 줄여 코드 집중도를 높였습니다. 단, 공개 API나 필드 선언에는 적용되지 않으므로 가독성 기준을 팀 컨벤션으로 정하는 것이 중요합니다."
    code_example='```java
var users = List.of("kim", "lee", "park");
for (var user : users) {
    System.out.println(user);
}
```'
    diff_text="Java 9가 모듈 시스템 중심이었다면, Java 10은 개발자 문법 편의성과 운영 환경 최적화에 집중했습니다. 기능 수는 적지만 실무 체감은 큰 릴리스입니다."
    ;;
  11)
    release_year="2018"
    summary_table="| 항목 | 내용 |\n|---|---|\n| LTS 릴리스 | 장기 지원 버전으로 기업 표준 채택 증가 |\n| HTTP Client 표준화 | `java.net.http` 정식 도입 |\n| 문자열 API | `isBlank`, `lines`, `repeat`, `strip` 추가 |\n| 파일 API | `Files.readString/writeString` 추가 |\n| 실행 편의 | 단일 파일 소스 실행(`java Hello.java`) 지원 |"
    representative_feature="표준 HTTP Client"
    representative_desc="외부 라이브러리 의존 없이 비동기 HTTP 호출, HTTP/2, WebSocket을 지원하면서 네트워크 레이어 구현이 단순해졌습니다."
    code_example='```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Java11HttpExample {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://example.com"))
                .build();

        HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.statusCode());
    }
}
```'
    diff_text="Java 10이 문법 보완 중심이었다면, Java 11은 LTS와 표준 라이브러리 성숙이 결합된 버전입니다. 특히 HTTP Client 표준화는 서버/클라이언트 코드베이스에 직접적인 영향을 줍니다."
    ;;
  12)
    release_year="2019"
    summary_table="| 항목 | 내용 |\n|---|---|\n| Switch 표현식(미리보기) | `switch`를 식(expression)으로 사용 가능 |\n| JVM 상수 API | 상수 기술 모델 확장 |\n| Shenandoah GC(실험) | 저지연 GC 옵션 강화 |\n| 마이크로벤치마크 개선 | JMH 연계 테스트 환경 개선 |\n| CDS 아카이브 확장 | 기본 클래스 공유 범위 확대 |"
    representative_feature="Switch Expressions (Preview)"
    representative_desc="명령문 중심이던 `switch`를 값 반환 가능한 식으로 발전시키는 시작점입니다. 이후 버전의 `yield`, 패턴 매칭으로 이어지는 기반이 됩니다."
    code_example='```java
int day = 5;
String type = switch (day) {
    case 1, 7 -> "weekend";
    default -> "weekday";
};
System.out.println(type);
```'
    diff_text="Java 11이 안정성과 LTS 채택 중심이었다면, Java 12는 짧은 릴리스 주기에서 언어 실험 기능을 빠르게 검증하는 전환점 역할을 했습니다."
    ;;
  13)
    release_year="2019"
    summary_table="| 항목 | 내용 |\n|---|---|\n| Switch 표현식 2차 개선 | `yield` 문법 정교화 방향 제시 |\n| 텍스트 블록(미리보기) | 멀티라인 문자열 작성 생산성 향상 |\n| 동적 CDS 아카이브 | 애플리케이션별 클래스 공유 최적화 |\n| 소켓 구현 개선 | 레거시 소켓 내부 구현 교체 준비 |\n| 메모리 관련 개선 | ZGC 등 저지연 옵션 성능 조정 |"
    representative_feature="Text Blocks (Preview)"
    representative_desc="SQL, JSON, HTML처럼 멀티라인 문자열을 코드 가독성 손실 없이 표현할 수 있습니다. 이 기능은 이후 Java 15에서 정식화됩니다."
    code_example='```java
String query = """
        SELECT id, name
        FROM users
        WHERE active = true
        ORDER BY created_at DESC
        """;
System.out.println(query);
```'
    diff_text="Java 12에서 시작된 언어 실험이 Java 13에서 사용성 측면으로 다듬어졌습니다. 실제 프로덕션 반영보다는 다음 LTS를 위한 사전 학습 버전이라는 성격이 강합니다."
    ;;
  14)
    release_year="2020"
    summary_table="| 항목 | 내용 |\n|---|---|\n| Switch 표현식 정식화 | JEP 361로 정식 기능 채택 |\n| Helpful NPE | NullPointerException 원인 메시지 강화 |\n| Records(미리보기) | 데이터 캐리어 클래스 문법 제안 |\n| Pattern Matching(미리보기) | `instanceof` 패턴 변수 제안 |\n| 패키징 도구 | jpackage(인큐베이터) 제공 |"
    representative_feature="Helpful NullPointerExceptions"
    representative_desc="운영 중 NullPointerException 분석 시간을 크게 줄여주는 실용 기능입니다. 어떤 참조가 null인지 메시지로 바로 확인할 수 있어 장애 대응 효율이 올라갑니다."
    code_example='```java
class User {
    Profile profile;
}
class Profile {
    String email;
}

public class Java14NpeExample {
    public static void main(String[] args) {
        User user = new User();
        System.out.println(user.profile.email);
    }
}
```'
    diff_text="Java 13이 실험 기능 중심이었다면, Java 14는 개발 생산성과 디버깅 효율을 실질적으로 끌어올린 버전입니다. 특히 switch 정식화는 이후 문법 진화의 기준점이 됩니다."
    ;;
  15)
    release_year="2020"
    summary_table="| 항목 | 내용 |\n|---|---|\n| Text Blocks 정식화 | 멀티라인 문자열 정식 기능 |\n| Sealed Classes(미리보기) | 상속 계층 제어 문법 도입 |\n| Hidden Classes | 프레임워크/바이트코드 생성 시나리오 지원 |\n| Records 2차 미리보기 | 데이터 모델 문법 개선 |\n| ZGC/Shenandoah 개선 | 메모리 반환 및 안정성 향상 |"
    representative_feature="Text Blocks (Final)"
    representative_desc="문서형 문자열을 별도 escaping 없이 관리할 수 있어 API 샘플, 쿼리, 템플릿 코드의 유지보수성이 크게 좋아집니다."
    code_example='```java
String json = """
        {
          "name": "whitewise95",
          "role": "developer"
        }
        """;
System.out.println(json);
```'
    diff_text="Java 14에서 준비된 언어 개선이 Java 15에서 점진적으로 정식화됩니다. 단기 릴리스지만 실무 코드 스타일에 직접 반영 가능한 변화가 많습니다."
    ;;
  16)
    release_year="2021"
    summary_table="| 항목 | 내용 |\n|---|---|\n| Records 정식화 | 불변 데이터 모델 표준 문법 |\n| Pattern Matching for instanceof 정식화 | 타입 체크 + 캐스팅 결합 |\n| Sealed Classes 2차 미리보기 | 도메인 모델의 닫힌 계층 설계 |\n| Vector API(인큐베이터) | SIMD 연산 실험 지원 |\n| macOS/AArch64 지원 | Apple Silicon 네이티브 지원 강화 |"
    representative_feature="Records (Final)"
    representative_desc="DTO, 이벤트, 요청/응답 모델처럼 데이터 중심 클래스를 간결하게 정의할 수 있습니다. 보일러플레이트 제거로 도메인 모델 의도를 더 명확히 드러냅니다."
    code_example='```java
public record OrderItem(String sku, int quantity) {}

public class Java16RecordExample {
    public static void main(String[] args) {
        OrderItem item = new OrderItem("A-100", 2);
        System.out.println(item.sku() + ":" + item.quantity());
    }
}
```'
    diff_text="Java 15가 정식화 전 단계였다면, Java 16은 현대적 Java 문법의 핵심 구성요소(Records, Pattern Matching)를 실제 표준으로 굳힌 버전입니다."
    ;;
  17)
    release_year="2021"
    summary_table="| 항목 | 내용 |\n|---|---|\n| LTS 릴리스 | Java 11 이후 장기 지원 표준 버전 |\n| Sealed Classes 정식화 | 상속 가능 타입 집합을 컴파일 타임 제어 |\n| Switch 패턴 매칭(미리보기) | 분기 로직의 타입 안정성 강화 |\n| RandomGenerator API | 난수 생성기 인터페이스 표준화 |\n| 강력한 캡슐화 강화 | 내부 JDK API 접근 제약 강화 |"
    representative_feature="Sealed Classes (Final)"
    representative_desc="도메인 모델에서 가능한 하위 타입을 명시적으로 제한해, 비즈니스 규칙을 타입 시스템에 반영할 수 있습니다."
    code_example='```java
public sealed interface Payment permits CardPayment, CashPayment {}
public final class CardPayment implements Payment {}
public final class CashPayment implements Payment {}
```'
    diff_text="Java 16이 문법 확정의 전초전이었다면, Java 17은 이를 LTS 안정 버전으로 묶어 대규모 서비스 전환의 기준점이 되었습니다."
    ;;
  18)
    release_year="2022"
    summary_table="| 항목 | 내용 |\n|---|---|\n| UTF-8 기본 인코딩 | 플랫폼 기본 charset을 UTF-8로 표준화 |\n| 간단한 웹 서버 | 로컬 개발용 `jwebserver` 도구 제공 |\n| 코드 스니펫 Javadoc | 문서와 실행 가능한 예제 연계 개선 |\n| 패턴 매칭 보강(미리보기) | switch 패턴 매칭 사용성 개선 |\n| Vector/Foreign API 개선 | 고성능 연산/네이티브 연계 실험 지속 |"
    representative_feature="UTF-8 by Default"
    representative_desc="운영체제/로케일에 따라 인코딩 이슈가 발생하던 문제를 크게 줄였습니다. 빌드/배포 환경 간 문자열 처리 일관성이 개선됩니다."
    code_example='```java
import java.nio.charset.Charset;

public class Java18EncodingExample {
    public static void main(String[] args) {
        System.out.println(Charset.defaultCharset());
    }
}
```'
    diff_text="Java 17이 LTS 전환 버전이라면, Java 18은 개발/운영 환경 일관성과 도구 경험 개선에 초점을 둔 릴리스입니다."
    ;;
  19)
    release_year="2022"
    summary_table="| 항목 | 내용 |\n|---|---|\n| Virtual Threads(프리뷰) | 경량 동시성 모델 초석 제공 |\n| Record Patterns(프리뷰) | 구조 분해 패턴 기반 데이터 접근 |\n| Linux/RISC-V 포팅 | 신규 아키텍처 공식 지원 |\n| Foreign Function & Memory API(프리뷰) | JNI 대안 방향 강화 |\n| Structured Concurrency(인큐베이터) | 작업 단위 동시성 관리 모델 제시 |"
    representative_feature="Virtual Threads (Preview)"
    representative_desc="기존 스레드-요청 1:1 모델의 자원 한계를 완화하고, 고동시성 서버에서 단순한 블로킹 코드 구조를 유지할 수 있는 길을 열었습니다."
    code_example='```java
public class Java19VirtualThreadExample {
    public static void main(String[] args) throws Exception {
        Thread.startVirtualThread(() -> System.out.println("Hello Virtual Thread"));
        Thread.sleep(100);
    }
}
```'
    diff_text="Java 18이 도구/환경 개선 위주였다면, Java 19는 Project Loom 기반 동시성 패러다임 전환을 본격적으로 드러낸 버전입니다."
    ;;
  20)
    release_year="2023"
    summary_table="| 항목 | 내용 |\n|---|---|\n| Scoped Values(인큐베이터) | 스레드 간 컨텍스트 전달 모델 제시 |\n| Record Patterns 2차 프리뷰 | 패턴 문법 완성도 향상 |\n| Switch 패턴 매칭 4차 프리뷰 | 분기 표현력 및 안정성 개선 |\n| Virtual Threads 2차 프리뷰 | 동시성 동작/진단 개선 |\n| FFM API 2차 프리뷰 | 네이티브 메모리/함수 접근 모델 보완 |"
    representative_feature="Scoped Values"
    representative_desc="복잡한 ThreadLocal 사용을 줄이고, 요청 단위 컨텍스트를 안전하게 전달하려는 접근입니다. 대규모 비동기/동시성 코드에서 관측성과 안정성을 높이는 데 유리합니다."
    code_example='```java
// Java 20 incubator API 예시 (개념 코드)
// final static ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();
// ScopedValue.where(REQUEST_ID, "req-123").run(() -> handle());
```'
    diff_text="Java 19가 Virtual Threads의 가능성을 보여줬다면, Java 20은 이를 중심으로 동시성 생태계(구조화/컨텍스트 전달) 전반을 다듬는 릴리스입니다."
    ;;
  21)
    release_year="2023"
    summary_table="| 항목 | 내용 |\n|---|---|\n| LTS 릴리스 | 현행 최신 LTS 기준 버전(2026-03 기준) |\n| Virtual Threads 정식화 | JEP 444, 대규모 동시성 처리 표준화 |\n| Record Patterns 정식화 | 구조 분해 기반 데이터 처리 표준화 |\n| Pattern Matching for switch 정식화 | 타입 기반 분기 코드 간결화 |\n| Sequenced Collections | 컬렉션 순서 일관 API 추가 |"
    representative_feature="Virtual Threads (Final)"
    representative_desc="Java 21의 핵심은 고동시성 서버 프로그래밍 모델의 대중화입니다. reactive 전환 없이도 스레드당 요청 모델을 유지하며 확장성을 확보할 수 있습니다."
    code_example='```java
import java.util.concurrent.Executors;

public class Java21VirtualThreadExample {
    public static void main(String[] args) throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 5; i++) {
                int taskId = i;
                executor.submit(() -> System.out.println("task=" + taskId));
            }
        }
    }
}
```'
    diff_text="Java 20까지 프리뷰/인큐베이터 단계였던 핵심 언어·동시성 기능이 Java 21에서 정식화되며, 기업 환경의 업그레이드 목표 버전으로 자리잡았습니다."
    ;;
  *)
    echo "Unsupported Java version: $next_version" >&2
    exit 1
    ;;
esac

file_name="$POST_DIR/$TODAY-java-$next_version-major-changes.md"
if [[ "$next_version" == "21" ]]; then
  next_teaser="이 시리즈는 Java 8부터 Java 21까지의 주요 변경사항 정리를 마칩니다."
else
  next_teaser="다음 글에서는 Java $(($next_version + 1)) 버전의 주요 변경사항을 이어서 다룹니다."
fi

cat > "$file_name" <<EOF_MD
---
layout: post
title: "Java $next_version 주요 변경사항"
date: $TODAY 00:00:00 +0900
categories: [Java]
tags: [java, java-$next_version, release-notes]
---

## 개요

Java $next_version(출시년도: **$release_year**)은(는) Java 생태계의 진화를 이어가는 중요한 릴리스입니다.
이 글에서는 실무 관점에서 꼭 알아야 할 변경사항을 요약하고, 대표 기능과 코드 예시를 통해 빠르게 이해할 수 있도록 정리합니다.

## 1) 출시년도

- **$release_year년 출시**
- 릴리스 라인: Java $next_version

## 2) 주요 변경사항 요약

$summary_table

## 3) 대표 기능 설명

### $representative_feature

$representative_desc

실무 적용 포인트:

- 코드 가독성/유지보수성 개선 여부를 먼저 검토
- 팀 코딩 컨벤션 및 빌드 파이프라인 호환성 확인
- 성능 향상 기능은 벤치마크로 검증 후 단계적 적용

## 4) 코드 예시

$code_example

## 5) 이전 버전과 차이점

$diff_text

## 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| 빌드/런타임 | CI, Docker 이미지, JDK 배포 채널 정합성 확인 |
| 프레임워크 호환 | Spring, Jakarta, 라이브러리 최소 지원 버전 검토 |
| 코드 스타일 | 신규 문법 도입 범위(점진/전면) 결정 |
| 운영 지표 | GC, 응답시간, CPU/메모리 추이 비교 |
| 롤백 전략 | 버전 업 실패 시 롤백 기준 및 절차 문서화 |

## 정리

Java $next_version의 핵심은 "새 기능 추가" 그 자체보다, **코드 품질과 운영 안정성을 어떻게 함께 개선할지**에 있습니다.
$next_teaser
EOF_MD

if [[ "$next_version" == "21" ]]; then
  completed="true"
fi

created="true"
created_version="$next_version"

echo "Created post: $file_name"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "created=$created"
    echo "completed=$completed"
    echo "version=$created_version"
  } >> "$GITHUB_OUTPUT"
fi
