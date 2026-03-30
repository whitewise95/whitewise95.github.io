---
layout: post
title: "[TIL][Spring Batch] 출석 리마인드 푸시 배치 설계 - 커서 기반(No-Offset) 페이징"
date: 2026-03-29 21:40:00 +0900
categories: [TIL]
tags: [spring-batch, querydsl, paging, no-offset, cursor]
---

대상 유저가 많아질 수 있는 배치에서 `offset/limit` 방식은 정합성 이슈를 만들 수 있습니다.

이번 출석 리마인드 푸시 배치에서는 `No-Offset(커서 기반)` 방식으로 Reader를 구현했습니다.

## 왜 Offset이 위험한가

배치가 1페이지를 처리하는 중간에 데이터가 바뀌면 문제가 생깁니다.

예시:

1. 1페이지 처리 중 일부 회원이 `WITHDRAWN`으로 변경
2. 다음 `offset` 페이지 조회 시 앞 데이터가 당겨짐
3. 일부 회원이 건너뛰어져 누락

즉, 페이지 번호 기반 접근은 데이터 변동에 취약합니다.

## 커서 기반 접근

마지막으로 읽은 `accountId`를 커서로 저장하고, 다음 조회는 `accountId > cursor` 조건으로 읽습니다.

```java
List<Long> accountIds = queryFactory.select(accountUser.accountId)
    .from(accountUser)
    .innerJoin(accountUser.account, account)
    .where(
        accountUser.accountId.gt(cursor),
        account.status.ne(Account.Status.WITHDRAWN),
        accountUser.lastAttendanceDt.isNull()
            .or(accountUser.lastAttendanceDt.lt(runDt))
    )
    .orderBy(accountUser.accountId.asc())
    .limit(1000)
    .fetch();
```

## 장점

- 정합성: 중간 삭제/상태변경에도 누락 위험 감소
- 성능: 큰 offset 스캔 비용 감소
- 운영 안정성: 재시도/재실행 시 범위 추적이 쉬움

## 구현 팁

- 커서 컬럼은 단조 증가(보통 PK)여야 합니다.
- 정렬과 커서 컬럼은 반드시 동일해야 합니다.
- Chunk 크기와 limit은 함께 튜닝해야 합니다.

## 체크리스트

- "데이터가 중간에 바뀔 수 있는가?" 라는 질문부터 했는가?
- `orderBy`와 `cursor` 조건이 같은 컬럼을 사용하는가?
- 재시작 시 커서 복원 전략(ExecutionContext 저장)을 준비했는가?
