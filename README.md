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

## 5) CMS 에디터 사용

이 저장소는 Decap CMS를 사용할 수 있도록 설정되어 있습니다.

- 관리자 URL: `https://whitewise95.github.io/admin/`
- 설정 파일: `admin/config.yml`

### 로그인/저장을 위한 OAuth 연결 (필수, 1회)

`github` 백엔드를 쓰는 Decap CMS는 OAuth 브릿지 서버가 필요합니다.
아래 3가지를 1회 연결하면 웹 에디터에서 글 작성/수정/저장이 가능합니다.

1. Decap OAuth Provider를 배포한다.  
2. GitHub OAuth App을 만들고 callback URL을 위 Provider 주소로 지정한다.  
3. `admin/config.yml`의 `backend`에 `base_url`, `auth_endpoint`를 추가한다.  

예시:

```yml
backend:
  name: github
  repo: whitewise95/whitewise95.github.io
  branch: main
  base_url: https://YOUR-OAUTH-PROVIDER-DOMAIN
  auth_endpoint: auth
```

참고: OAuth 연결 전에는 `/admin/` UI만 열리고 실제 로그인/저장은 동작하지 않습니다.
