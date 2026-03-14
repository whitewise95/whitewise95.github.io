---
layout: post
title: "[24.11.26~24.12.31] keycloak 데모 구축"
date: 2025-02-17 22:12:28 +0900
categories: [회사생활]
tags: [회사생활, keycloak, oauth2, sso]
permalink: /company-life/company-life-keycloak-demo/
---

> 벨로그 시리즈 '회사생활'에서 옮긴 글입니다. 원문 흐름은 유지하고, GitHub 블로그 형식에 맞게 정리했습니다.

![](https://velog.velcdn.com/images/whitewise95/post/3e0b688e-0c30-4b09-aac3-b7d3335e4957/image.jpg)

# keycloak 사용 이유

우리 애플리케이션에 OAuth 2.0과 SSO(Single Sign-On) 기능을 도입하기 위해 Keycloak을 선택하게 되었다.

최근 대표님께서 OAuth 2.0을 적용하여 외부 서비스(예: Google, Kakao, Apple) 로그인 기능을 추가하고, 동시에 SSO 기능을 활용하여 사용자들이 하나의 계정으로 여러 서비스에 로그인할 수 있도록 개선할 것을 요청하셨다.

기존 시스템에서 직접 OAuth 2.0과 SSO를 구현할 수도 있지만, 이는 많은 개발 비용과 유지보수 부담을 초래한다. 이를 해결하기 위해, 인증 및 권한 관리에 특화된 Keycloak을 도입하기로 결정했다.


## 1. Keycloak을 선택한 주요 이유

1. OAuth 2.0 및 OpenID Connect 지원 
Keycloak은 OAuth 2.0과 OpenID Connect 표준을 기본적으로 지원한다. 이를 통해 Google, Kakao, Naver 같은 외부 인증 제공자와 쉽게 연동할 수 있다. 또한, 자체 로그인 시스템을 운영하면서도 OAuth 2.0 방식을 활용하여 보다 안전한 인증 환경을 구축할 수 있다. 

2. SSO(Single Sign-On) 기능 제공
Keycloak을 도입하면 사용자가 한 번 로그인하면 동일한 계정을 사용하여 여러 애플리케이션에 자동으로 로그인할 수 있다.
이를 통해 사용자 경험(UX)을 개선하고, 비밀번호 입력 횟수를 줄여 보안성을 강화할 수 있다.

3. 확장성과 유지보수의 용이성
Keycloak은 오픈소스 기반으로 자유롭게 커스터마이징 가능하고
플러그인 및 SPI(서비스 프로바이더 인터페이스)를 통해 다양한 기능 추가 가능했다. 
또한 Spring Security, React, Vue.js 등 다양한 기술 스택과 연동이 용이했다.

4. Docker 및 Kubernetes 지원
Keycloak은 Docker 컨테이너 환경에서 쉽게 배포할 수 있으며, Kubernetes에도 최적화되어 있다.
이를 통해 클라우드 환경에서 손쉽게 확장하고 유지보수할 수 있다.


# 데모 구축 
Keycloak 데모 버전을 구축하는 데 약 한 달 정도의 기간이 소요되었다.
Keycloak에 대해 전혀 알지 못한 상태에서 시작했기 때문에, 기본적인 개념부터 학습하며 구축을 진행했다.

Keycloak을 공부하는 과정에서 애매하게 알고 있던 OAuth 2.0에 대해서도 다시 한번 정리할 수 있는 좋은 기회가 되었다.
단순히 Keycloak을 적용하는 것뿐만 아니라, OAuth 인증 방식에 대한 개념을 명확하게 이해하고 실무에 활용할 수 있도록 정리할 수 있었다.

초기에는 Keycloak의 구조와 설정 방식이 다소 복잡하게 느껴졌지만, 관리 콘솔의 직관적인 UI와 다양한 공식 문서를 참고하면서 점차 익숙해질 수 있었다. (chatGPT의 도움을 많이 받은.... ㅎㅎ)
특히, OAuth 2.0의 인증 흐름과 SSO 적용 방식을 직접 실험해보면서 Keycloak이 어떻게 동작하는지 깊이 있게 이해할 수 있었다.

이번 데모 구축을 통해 얻은 경험을 바탕으로, 향후 실무에서 Keycloak을 활용한 인증 및 권한 관리 시스템을 더욱 효과적으로 운영할 수 있을 것이라 기대되었다.


## 1. OAuth
OAuth는 사실 깊에 공부한적이 없고  Google, Kakao, Naver 로그인을 OAuth라고 생각하며 가볍게 넘겼다. 

OAuth 2.0은 "권한 부여(Authorization) 프레임워크로 사용자의 자원(Resource)에 대한 접근 권한을 위임(Delegate)하는 표준 프로토콜이다. 

즉, 사용자의 ID와 비밀번호를 직접 제공하지 않고도, 특정 서비스(예: Google, Facebook)를 통해 다른 애플리케이션이 사용자의 정보를 접근할 수 있도록 해준다.

## 2. OpenID Connect(OIDC)
>
> OAuth 2.0은 **"사용자가 특정 서비스의 데이터를 제3자 애플리케이션이 접근할 수 있도록 > 권한을 부여하는 표준 프로토콜"**이다.
>
>  로그인 기능을 구현하려면 OAuth 2.0 + OpenID Connect(OIDC) 를 사용해야 한다.


 
OpenID Connect (OIDC) 는 OAuth 2.0을 기반으로 인증(Authentication) 기능을 추가한 인증 및 권한 부여 프로토콜이다. OAuth 2.0이 해결하지 못하는 **"사용자의 신원(Identity)을 보장하는 문제"**를  ID Token 이라는 개념을 도입해서 해결했다. 


> ✅ ID Token이란?
OIDC에서 ID Token 은 사용자의 신원을 보장하는 토큰이다.
ID Token은 JWT(JSON Web Token) 형식으로 제공되며, 내부에 다음과 같은 사용자 정보(Claims)를 포함한다.

📌 ID Token 예시 (JWT Payload)
```json
{
  "iss": "https://accounts.google.com",  // 발급자 (Issuer)
  "sub": "1234567890",  // 사용자 ID (Subject)
  "aud": "my_client_id",  // 클라이언트 ID (Audience)
  "exp": 1681234567,  // 만료 시간 (Expiration)
  "iat": 1681230000,  // 발급 시간 (Issued At)
  "email": "user@example.com",  // 사용자 이메일
  "name": "홍길동"  // 사용자 이름
}
```
- 발급자(iss, Issuer): ID Token을 발급한 인증 서버
- 사용자 ID(sub, Subject): 해당 서비스에서의 고유한 사용자 ID
- 클라이언트 ID(aud, Audience): 이 토큰을 사용할 서비스의 ID
- 만료 시간(exp, Expiration): 토큰이 언제 만료되는지
- 이메일(email), 이름(name): 사용자의 추가 정보


📌 ID Token의 핵심 역할
- 사용자의 신원을 증명하는 디지털 서명 포함 (JWT 서명 검증 가능)
- 로그인 후 사용자의 프로필 정보 제공 가능

--- 
🔹 OpenID Connect(OIDC) 로그인 과정
1. 사용자가 "Google 계정으로 로그인" 버튼을 클릭
2. 클라이언트(앱)가 OIDC 인증 요청을 보냄
3. 사용자가 OAuth 2.0의 로그인 승인 페이지에서 로그인
4. 인증 서버가 사용자를 인증하고 인가 코드(Authorization Code)를 발급
5. 클라이언트(앱)가 인가 코드를 사용하여 Access Token + ID Token을 요청
6. ID Token을 검증하여 사용자의 신원을 확인
7. 사용자가 로그인 완료됨
--- 

# 후기 

Keycloak을 Docker로 실행하고, 관리 콘솔을 통해 Realm, Client, User를 생성하는 과정은 공식 문서도 잘 정리되어 있었고,
블로그 자료도 많아서 비교적 수월하게 진행할 수 있었다.

하지만 SPI(Service Provider Interface)를 활용하여 데이터베이스를 커스텀하거나, 테마를 변경하고, 인증 플로우를 커스텀하는 작업은 생각보다 어려웠다.
관련 문서도 많지 않았고, 누군가 공유해둔 자료를 찾아봐도 이해하기 어려운 부분이 많았다.

그럼에도 불구하고, ChatGPT를 활용하면서 점진적으로 개념을 정리하고 구현 방법을 찾아가면서 해결할 수 있었다.

결국 Keycloak을 활용한 데모 버전을 구축하는 데 성공했고, 이를 통해 Keycloak의 기본적인 구조뿐만 아니라, 커스텀 SPI 개발, 테마 커스터마이징, 인증 플로우 확장 등 깊이 있는 학습을 할 수 있는 좋은 경험이 되었다.

Keycloak은 단순히 OAuth 2.0과 OpenID Connect를 지원하는 인증 서버 이상의 확장성과 유연성을 제공하는 강력한 솔루션이라는 점을 다시 한번 실감하게 되었다. 

