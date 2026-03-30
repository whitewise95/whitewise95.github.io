---
layout: post
title: "[TIL][Spring Batch] 출석 리마인드 푸시 배치 트러블슈팅 3 - Writer 누락 버그"
date: 2026-03-30 21:50:00 +0900
categories: [TIL]
tags: [spring-batch, writer, bugfix, push, checklist]
---

컴파일과 배치 실행은 정상인데 푸시 서버에 데이터가 가지 않는 문제가 있었습니다.

결론은 단순하지만 위험한 논리 버그였습니다.

## 문제 코드

```java
List<CommonPushDto.Request.Target> targetList = new ArrayList<>();
for (Long accountId : chunk.getItems()) {
    CommonPushDto.Request.Target target = new CommonPushDto.Request.Target();
    target.setAccountId(accountId);
    // targetList.add(target); 누락
}
```

객체는 생성했지만 리스트에 넣지 않아, 실제 전송 payload는 빈 목록이었습니다.

## 왜 놓치기 쉬웠나

- 예외가 발생하지 않음 (정상 흐름처럼 보임)
- 로깅이 "호출 시도" 중심으로 되어 있고 "실제 건수" 검증이 부족했음
- Writer는 보통 IO 경계라서, 로직 누락이 있으면 조용히 실패하기 쉬움

## 개선한 방어 장치

### 1) 전송 전 건수 검증

```java
if (targetList.isEmpty()) {
    log.warn("attendance reminder push target list is empty. chunkSize={}", chunk.getItems().size());
    return;
}
```

### 2) 핵심 메트릭 기록

- 입력 건수 (`chunk.getItems().size()`)
- 변환 건수 (`targetList.size()`)
- 전송 성공/실패 건수

### 3) Writer 단위 테스트

- chunk 입력 시 targetList가 동일 건수로 만들어지는지 검증
- 빈 chunk 입력 시 외부 호출이 없는지 검증

## 배운 점

- 배치 안정성은 "예외 처리"보다 "침묵 실패(silent failure) 탐지"가 더 중요할 때가 많습니다.
- Writer에는 반드시 "입력 건수 = 출력 건수" 관점의 검증 포인트가 필요합니다.

## 회고

이번 작업은 단순 푸시 발송이 아니라,

- DI 명시성
- 배치 빈 생명주기
- 커서 기반 정합성
- Writer 방어 로직

을 한 번에 점검한 케이스였습니다.

다음 배치부터는 설계 초기에 아래 네 가지를 기본 템플릿으로 가져가려고 합니다.

1. Reader/Writer 주입 모호성 제거
2. JobParameter 사용 컴포넌트 스코프 고정
3. No-Offset 기본 적용 검토
4. Writer 변환 건수 검증 로깅/테스트 포함
