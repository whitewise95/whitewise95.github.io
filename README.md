# Jekyll GitHub Pages Blog

GitHub Pages용 Jekyll 블로그 템플릿입니다.

## 1) GitHub 연결

아래 명령으로 원격을 연결합니다.

```bash
git remote add origin git@github.com:whitewise95/whitewise95.github.io.git
git branch -M main
git push -u origin main
```

## 2) GitHub Pages 설정

- Repository: `whitewise95.github.io`
- Settings -> Pages -> Build and deployment
- Source를 `GitHub Actions`로 설정

## 3) 새 글 작성

- 위치: `_posts/`
- 파일명: `YYYY-MM-DD-title.md`

예시:

```markdown
---
layout: post
title: "새 글 제목"
date: 2026-03-08 20:00:00 +0900
categories: [blog]
tags: [jekyll, github-pages]
---

본문
```

## 4) 로컬 미리보기

```bash
bundle install
bundle exec jekyll serve
```

브라우저에서 `http://127.0.0.1:4000` 확인.

## 5) Java 버전 포스팅 자동화

- 워크플로 파일: `.github/workflows/auto-java-posts.yml`
- 실행 시각: 매일 00:00 (KST, GitHub cron `0 15 * * *`)
- 생성 규칙:
  - Java 8부터 Java 21까지 순차 작성
  - 하루 1개만 생성
  - 제목: `Java {버전} 주요 변경사항`
  - 카테고리: `Java`
  - Java 21 작성 완료 시 스케줄 워크플로 자동 비활성화
