---
layout: post
title: "Java 12 주요 변경사항"
date: 2026-03-15 00:00:00 +0900
categories: [Java]
tags: [java, java-12, release-notes, switch-expression, g1, shenandoah]
permalink: /java/java-12-major-changes/
---

## 개요

Java 12는 **2019년 3월**에 출시된 비LTS(단기 지원) 릴리스입니다.
Java 11 LTS 이후 등장한 버전으로, 언어 실험 기능과 GC 튜닝 개선이 함께 들어가면서
"다음 LTS(17)로 가기 전 실험/검증" 단계에서 많이 활용됐습니다.

이 글은 Java 12의 핵심 변경사항을 실무 관점으로 정리합니다.

1. 출시년도
2. 주요 변경사항 요약
3. 대표 기능 설명
4. 변경사항별 코드 예시
5. 이전 버전(Java 11)과 차이점

## 1) 출시년도

| 항목 | 내용 |
|---|---|
| 버전 | Java 12 |
| 출시년도 | 2019년 |
| 릴리스 성격 | 단기 릴리스(비LTS), 실험 기능 + 런타임 튜닝 |

## 2) 주요 변경사항 요약

| 변경사항 | 핵심 요약 | 실무 영향 |
|---|---|---|
| Switch Expression (Preview) | `switch`를 식(Expression)으로 사용 가능 | 분기 결과 반환 코드 간결화 |
| JVM Constants API | 상수/심볼 표현용 표준 API 추가 | 바이트코드/리플렉션 도구 개발 유리 |
| G1 개선 (Abortable Mixed Collections) | 혼합 수집 중단 가능 | GC pause time 예측성 향상 |
| G1 메모리 반환 개선 | 유휴 힙 메모리를 OS에 더 적극 반환 | 컨테이너 메모리 효율 개선 |
| Shenandoah GC (Experimental) | 저지연 GC 실험 옵션 확대 | 대용량 힙 지연시간 최적화 실험 가능 |
| 기본 CDS 아카이브 | 기본 클래스 데이터 공유 아카이브 사용 강화 | JVM 시작 시간/메모리 사용 최적화 |

## 3) 대표 기능 설명

### Switch Expression (Preview)

Java 12의 대표 기능은 **Switch Expression(미리보기)** 입니다.
기존 `switch` 문은 분기 후 상태 변수에 값을 넣는 패턴이 많아 장황했는데,
Java 12부터는 `switch`가 값을 직접 반환할 수 있어 코드가 훨씬 간결해집니다.

적용 포인트:

- 다중 분기 결과를 "값"으로 반환할 때 적극 활용
- `break` 누락 버그를 줄이고 의도를 명확히 표현
- Java 12에서는 Preview 기능이므로 컴파일/실행 옵션 필요

## 4) 변경사항별 예시

### 4-1. 기존 switch 문 vs switch expression

```java
public class SwitchStatementVsExpression {
    enum Grade { A, B, C, D }

    public static void main(String[] args) {
        Grade grade = Grade.B;

        // 기존 switch 문 스타일
        String messageOld;
        switch (grade) {
            case A:
                messageOld = "excellent";
                break;
            case B:
                messageOld = "good";
                break;
            case C:
                messageOld = "pass";
                break;
            default:
                messageOld = "retry";
        }

        // Java 12 preview switch expression 스타일
        String messageNew = switch (grade) {
            case A -> "excellent";
            case B -> "good";
            case C -> "pass";
            default -> "retry";
        };

        System.out.println(messageOld);
        System.out.println(messageNew);
    }
}
```

설명:

- 화살표(`->`) 케이스로 fall-through 실수를 줄임
- 결과 반환형이 분명해져 리팩터링 안정성 증가

### 4-2. 블록에서 `yield`로 값 반환

```java
public class SwitchYieldExample {
    public static void main(String[] args) {
        int month = 1;

        String season = switch (month) {
            case 12, 1, 2 -> {
                String label = "winter";
                yield label;
            }
            case 3, 4, 5 -> "spring";
            case 6, 7, 8 -> "summer";
            case 9, 10, 11 -> "autumn";
            default -> throw new IllegalArgumentException("invalid month");
        };

        System.out.println(season);
    }
}
```

설명:

- 복합 로직 블록에서도 명시적으로 `yield` 반환 가능
- 분기별 반환값 관리가 쉬워짐

### 4-3. Preview 기능 컴파일/실행

```text
# 컴파일
javac --enable-preview --release 12 SwitchStatementVsExpression.java

# 실행
java --enable-preview SwitchStatementVsExpression
```

설명:

- Java 12의 switch expression은 preview이므로 옵션이 필수
- CI 빌드 스크립트에도 동일 옵션 반영 필요

### 4-4. JVM Constants API 사용 예시

```java
import java.lang.invoke.MethodHandles;
import java.lang.invoke.MethodType;
import java.lang.invoke.ConstantBootstraps;
import java.lang.invoke.ClassDesc;

public class JvmConstantsApiExample {
    public static void main(String[] args) throws Throwable {
        // 간단한 상수 부트스트랩 호출 예시
        String value = (String) ConstantBootstraps.nullConstant(
                MethodHandles.lookup(),
                "x",
                ClassDesc.of("java.lang.String")
        );

        System.out.println(value); // null
    }
}
```

설명:

- 프레임워크/도구(바이트코드 생성, 메타프로그래밍) 개발에서 유용
- 일반 비즈니스 애플리케이션 개발자가 직접 사용할 일은 상대적으로 적음

### 4-5. G1 튜닝/로그 확인 예시

```text
java -XX:+UseG1GC -Xms2g -Xmx2g -Xlog:gc*=info -jar app.jar
```

설명:

- Java 12의 G1 개선은 pause time 안정화에 초점
- 업그레이드 전후 GC 로그 비교로 효과 검증 권장

### 4-6. 유휴 메모리 반환 동작 확인

```text
# 컨테이너에서 메모리 관찰 예시
java -XX:+UseG1GC -Xms256m -Xmx2g -Xlog:gc+heap=info -jar app.jar
```

설명:

- 트래픽 변동 폭이 큰 서비스에서 메모리 회수 체감 가능
- Kubernetes 환경에서는 실제 RSS/컨테이너 메모리 지표를 함께 확인

### 4-7. Shenandoah GC 실험 예시

```text
java -XX:+UnlockExperimentalVMOptions -XX:+UseShenandoahGC -Xms4g -Xmx4g -jar app.jar
```

설명:

- 저지연(짧은 pause) 목표 워크로드에서 실험 가치가 높음
- 실험 기능이므로 성능/안정성 검증 없이 즉시 운영 적용은 지양

### 4-8. 기본 CDS 활용 확인

```text
java -Xshare:auto -version
```

설명:

- 기본 CDS 아카이브 활용으로 시작 비용 절감 기대
- 짧은 수명 프로세스/CLI 도구에서 효과가 더 잘 보임

## 5) 이전 버전(Java 11)과 차이점

| 비교 항목 | Java 11 | Java 12 |
|---|---|---|
| 릴리스 성격 | LTS, 장기 운영 기준 | 비LTS, 단기 실험/검증 중심 |
| 언어 기능 | 문자열/파일/HTTP API 성숙 | switch expression(Preview) 도입 |
| GC 관점 | ZGC, Epsilon 등 선택지 확대 | G1 pause 예측성/메모리 반환 개선 |
| 운영 관점 | 표준 API 확장으로 즉시 실전 적용 | 차기 버전 대비 실험/최적화 포인트 강화 |
| 업그레이드 전략 | 장기 고정 버전으로 채택 많음 | 다음 LTS 전 중간 점검 버전 |

핵심 정리:

- Java 11이 "안정적인 LTS 기준점"이라면,
- Java 12는 "언어/런타임의 다음 방향을 실험하는 릴리스"입니다.

## 실무 마이그레이션 체크리스트

| 체크 항목 | 확인 내용 |
|---|---|
| switch expression 도입 | Preview 옵션 포함한 빌드 파이프라인 구성 여부 확인 |
| 코드 컨벤션 | switch expression 사용 기준(허용 범위) 합의 |
| GC 성능 테스트 | Java 11 대비 pause time, throughput, RSS 비교 |
| 컨테이너 지표 | 메모리 반환 개선이 실제 운영 지표에 반영되는지 확인 |
| 실험 기능 정책 | Preview/Experimental 기능의 운영 반영 기준 문서화 |

## 마무리

Java 12는 장기 운영 버전이라기보다, 팀이 다음 언어/런타임 변화를 미리 흡수하기에 좋은 릴리스입니다.
다음 글(Java 13)에서는 switch expression 정제와 텍스트 블록(Preview)을 중심으로 이어서 정리하겠습니다.
