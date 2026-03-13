---
layout: post
title: "Java 10 주요 변경사항"
date: 2026-03-13 00:00:00 +0900
categories: [Java]
tags: [java, java-10, release-notes, var, jvm]
permalink: /java/java-10-major-changes/
---

## 개요

Java 10은 **2018년 3월**에 출시된 버전으로, Java 9의 구조적 변화 이후
개발 생산성과 런타임 운영 효율을 강화한 릴리스입니다.
기능 개수는 많지 않지만 실무에서 체감이 큰 포인트가 명확합니다.

이 글은 Java 10의 핵심 변화와 코드 예시를 중심으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. Java 9 대비 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 10 |
| 출시년도 | 2018년 |
| 릴리스 성격 | 생산성 문법 + JVM/운영 최적화 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| 지역 변수 타입 추론(`var`) | 로컬 변수 선언 간결화 | 코드 가독성 향상(적절히 사용 시) |
| 컬렉션 복사 팩토리 | `List.copyOf`, `Set.copyOf`, `Map.copyOf` | 불변 복사 코드 표준화 |
| Optional 개선 | `orElseThrow()` 무인자 오버로드 | 예외 흐름 코드 간결화 |
| G1 GC 개선 | Parallel Full GC 지원 | Full GC 구간 응답성 개선 |
| Application CDS | 앱 클래스까지 공유 아카이브 가능 | JVM 시작 시간/메모리 사용 최적화 |
| 컨테이너 인식 강화 | cgroup 기반 CPU/메모리 인식 개선 | Docker/K8s 환경 튜닝 정확도 향상 |
| 실험적 Graal JIT | JVMCI 기반 JIT 컴파일러 실험 지원 | 고성능 런타임 연구/검증 가능 |

## 3) 대표 기능 설명

### 지역 변수 타입 추론 (`var`)

Java 10의 대표 기능은 `var`입니다.
복잡한 제네릭 타입 선언을 줄여 로컬 코드 가독성을 높여주지만,
타입이 불명확해지면 오히려 읽기 어려워질 수 있어 사용 기준이 중요합니다.

적용 포인트:

- 초기화 표현식만 보고 타입이 명확한 경우에만 사용
- 메서드 파라미터/필드에는 사용 불가(로컬 변수 전용)
- 팀 코드리뷰 기준으로 `var` 허용/비허용 패턴 명확화

## 4) 변경사항별 예시

### 4-1. `var` 기본 사용

```java
import java.util.ArrayList;
import java.util.HashMap;

public class VarBasicExample {
    public static void main(String[] args) {
        var names = new ArrayList<String>();
        names.add("kim");
        names.add("lee");

        var scoreByUser = new HashMap<String, Integer>();
        scoreByUser.put("kim", 100);

        System.out.println(names);
        System.out.println(scoreByUser);
    }
}
```

설명:

- 오른쪽 초기화 식이 충분히 명확하면 `var`가 유리
- `var data = get();`처럼 타입 추론이 불분명한 코드는 지양

### 4-2. `var` + for-each / index loop

```java
import java.util.List;

public class VarLoopExample {
    public static void main(String[] args) {
        var users = List.of("alpha", "beta", "gamma");

        for (var user : users) {
            System.out.println(user.toUpperCase());
        }

        for (var i = 0; i < users.size(); i++) {
            System.out.println(i + " -> " + users.get(i));
        }
    }
}
```

설명:

- 루프 변수 선언이 짧아져 반복 코드가 깔끔해짐
- 인덱스 변수에도 자연스럽게 적용 가능

### 4-3. 컬렉션 복사 팩토리 (`copyOf`)

```java
import java.util.ArrayList;
import java.util.List;

public class CopyOfExample {
    public static void main(String[] args) {
        var mutable = new ArrayList<String>();
        mutable.add("A");
        mutable.add("B");

        List<String> immutableCopy = List.copyOf(mutable);
        System.out.println(immutableCopy);

        mutable.add("C");
        System.out.println(mutable);       // [A, B, C]
        System.out.println(immutableCopy); // [A, B]
    }
}
```

설명:

- 입력 컬렉션 변경과 분리된 불변 복사본 생성
- DTO/응답 객체 방어적 복사 패턴에 유용

### 4-4. Optional `orElseThrow()` 무인자

```java
import java.util.Optional;

public class OptionalNoArgOrElseThrowExample {
    static Optional<String> findToken(boolean exists) {
        return exists ? Optional.of("token-123") : Optional.empty();
    }

    public static void main(String[] args) {
        String token = findToken(true).orElseThrow();
        System.out.println(token);
    }
}
```

설명:

- `orElseThrow(NoSuchElementException::new)` 대신 간결하게 사용 가능

### 4-5. G1 Parallel Full GC (개념 확인 코드)

```text
# 실행 시 예시 JVM 옵션
java -XX:+UseG1GC -Xms2g -Xmx2g -Xlog:gc* -jar app.jar
```

설명:

- Java 10에서 G1 Full GC가 병렬화되어, 일부 워크로드에서 정지 시간 개선
- 실제 효과는 힙 크기/객체 생명주기/트래픽 패턴에 따라 다르므로 GC 로그 비교 필수

### 4-6. Application CDS 사용 흐름

```text
# 1) 클래스 로딩 목록 생성
java -Xshare:off -XX:DumpLoadedClassList=app.lst -jar app.jar

# 2) 아카이브 생성
java -Xshare:dump -XX:SharedClassListFile=app.lst -XX:SharedArchiveFile=app.jsa -cp app.jar

# 3) 아카이브 사용
java -Xshare:on -XX:SharedArchiveFile=app.jsa -jar app.jar
```

설명:

- 시작 시간 최적화가 중요한 CLI/마이크로서비스/짧은 수명 프로세스에서 특히 유의미

### 4-7. 컨테이너 리소스 인식 확인

```text
# Docker 예시
docker run --rm -m 512m --cpus=1 openjdk:10-jdk java -XshowSettings:system -version
```

설명:

- Java 10은 cgroup 제한 자원을 더 정확히 인식
- JVM 기본값이 컨테이너 제한에 맞춰 계산되어 OOM/과할당 위험 감소

### 4-8. 실험적 Graal JIT 사용 예시

```text
java -XX:+UnlockExperimentalVMOptions -XX:+UseJVMCICompiler -version
```

설명:

- 프로덕션 기본값이라기보다 성능 연구/검증 용도
- 워크로드별 성능 특성 비교 후 선택해야 함

## 5) 이전 버전(Java 9)과 차이점

| 비교 항목 | Java 9 | Java 10 |
|---|---|---|
| 핵심 초점 | 모듈 시스템(JPMS) 도입 | 생산성(`var`) + 런타임 최적화 |
| 컬렉션 API | `List.of` 등 생성 팩토리 | `copyOf`로 불변 복사 강화 |
| Optional | `ifPresentOrElse`, `or` 추가 | `orElseThrow()` 무인자 간소화 |
| JVM 관점 | 구조/캡슐화 중심 변화 | GC/CDS/컨테이너 운영 체감 개선 |
| 릴리스 성격 | 구조적 전환 릴리스 | 안정적 단기 릴리스 운영 패턴 |

핵심 정리:

- Java 9이 아키텍처 경계를 세웠다면,
- Java 10은 일상 개발/운영 효율을 높이는 실용적 개선에 집중했습니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| `var` 코딩 규칙 | 허용 위치/금지 패턴(모호 타입) 팀 가이드 확정 |
| 컬렉션 복사 정책 | 외부 입력/응답 객체에 `copyOf` 적용 여부 결정 |
| GC 성능 검증 | Java 9 대비 GC pause/throughput 지표 비교 |
| 컨테이너 운영 | CPU/메모리 제한 기준으로 JVM 옵션 재검토 |
| 부팅 성능 | AppCDS 적용 전후 스타트업 시간 측정 |

## 마무리

Java 10은 기능 수보다 "실제 개발/운영 편의"가 중요한 버전입니다.
다음 글(Java 11)에서는 LTS 전환 관점과 표준 HTTP Client, 문자열 API 강화 중심으로 이어서 정리하겠습니다.
