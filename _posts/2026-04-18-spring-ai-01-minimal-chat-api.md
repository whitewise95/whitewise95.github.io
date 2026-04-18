---
layout: post
title: "처음 시작하는 Spring AI: 공식 문서 기준으로 만드는 최소 챗 API"
date: 2026-04-18 10:10:00 +0900
categories: [spring-ai]
permalink: /spring-ai/spring-ai-01-minimal-chat-api/
---

Spring Boot 애플리케이션에서 AI 기능을 붙이고 싶을 때, 가장 먼저 필요한 것은 "정말 최소 단위로 한 번 성공해보는 경험"입니다.
이 글은 작성 시점의 공식 문서 기준으로, Spring AI와 Spring Boot를 사용해 `/ai/chat` 엔드포인트를 만들고 실제 응답을 받는 것까지 차근차근 정리합니다.
먼저 작은 성공을 만든 뒤, 다음 편에서 프롬프트 템플릿과 메모리 같은 기능으로 확장해가겠습니다.

> 작성 시점 기준(공식 문서): Spring AI 1.1.x 안정화 라인, Spring Boot 3.5.x 라인

## 시리즈 구성

- 1편(현재): 최소 챗 API 만들기 (`/ai/chat`)
- 2편: Prompt Template 제대로 쓰기
- 3편: Advisor와 대화 메모리
- 4편: RAG 입문 (Vector Store 연결)
- 5편: Tool Calling과 MCP 기초

## 목차

1. Spring AI를 왜 쓰는가
2. 프로젝트 생성과 기본 준비
3. 가장 작은 챗 API 만들기
4. 프롬프트를 조금 더 실용적으로 다루기
5. 실행과 점검 포인트
6. 정리와 다음 단계

---

## 1. Spring AI를 왜 쓰는가

### 왜 필요한지

AI API를 직접 HTTP로 붙이기 시작하면, 모델 교체, 요청/응답 포맷 관리, 스트리밍, 프롬프트 구성, 재시도 정책 같은 공통 고민이 금방 늘어납니다.
Spring AI는 이런 반복 작업을 Spring 방식으로 추상화해서, 애플리케이션 코드가 비즈니스 로직에 집중하도록 도와줍니다.

### 무엇을 하는지

- 모델 제공자별 API 차이를 줄여주는 공통 인터페이스 제공
- `ChatModel`, `ChatClient`, `Prompt` 같은 일관된 프로그래밍 모델 제공
- 이후 Advisor, Memory, RAG, Tool Calling으로 자연스럽게 확장 가능

### 여기서 기억할 점

- 오늘 목표는 거창한 기능이 아니라, **최소 코드로 챗 호출 성공**입니다.
- "작게 시작해서 점진적으로 확장"하는 것이 가장 안전합니다.

---

## 2. 프로젝트 생성과 기본 준비

### 왜 필요한지

시작할 때 버전/의존성 정합이 맞지 않으면, 입문 단계에서 가장 많이 막힙니다.
그래서 공식 문서 권장 조합으로 최소 구성을 먼저 맞춥니다.

### 무엇을 하는지

- Spring Boot 프로젝트 생성
- Web + Spring AI OpenAI 스타터 추가
- API Key를 외부 설정으로 분리

### 어떻게 구현하는지

#### 2-1. 의존성 추가 (`build.gradle`)

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.5.13'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'io.whitewise95'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.ai:spring-ai-starter-model-openai'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

이 코드의 역할: Spring Boot 웹 앱에 Spring AI OpenAI 모델 스타터를 추가해 최소 챗 기능 실행 기반을 만듭니다.

#### 2-2. 설정 파일 (`src/main/resources/application.yml`)

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4.1-mini
```

이 코드의 역할: 모델 호출에 필요한 API 키와 기본 모델 옵션을 선언합니다. 키는 반드시 환경 변수로 주입합니다.

#### 2-3. API 키 주입 예시 (로컬 터미널)

```bash
export OPENAI_API_KEY=sk-...
```

이 코드의 역할: 소스코드/깃에 키를 남기지 않고 런타임 환경변수로만 주입합니다.

### 실행하면 무엇이 되는지

애플리케이션이 실행될 때 Spring AI 자동 설정이 `ChatModel`과 `ChatClient.Builder`를 빈으로 준비합니다.

### 여기서 기억할 점

- API 키를 `application.yml`에 하드코딩하지 않습니다.
- 입문 단계에서는 모델 하나를 고정해두는 편이 디버깅에 유리합니다.

---

## 3. 가장 작은 챗 API 만들기

### 왜 필요한지

입문자는 일단 "요청을 보내면 응답이 온다"는 성공 경험이 중요합니다.
그래야 이후 Prompt Template, Memory 같은 개념도 쉽게 받아들일 수 있습니다.

### 무엇을 하는지

- `/ai/chat` 엔드포인트를 만듭니다.
- 요청 파라미터 `message`를 받아 AI 응답 문자열을 반환합니다.

### 어떻게 구현하는지

#### 3-1. 컨트롤러 작성

```java
package io.whitewise95.demo.ai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AiChatController {

    private final ChatClient chatClient;

    public AiChatController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @GetMapping("/ai/chat")
    public String chat(@RequestParam(defaultValue = "Spring AI를 한 줄로 소개해줘") String message) {
        return chatClient.prompt()
                .user(message)
                .call()
                .content();
    }
}
```

이 코드의 역할: 사용자의 질문을 ChatClient에 전달하고, 가장 단순한 텍스트 응답만 반환합니다.

### 실행하면 무엇이 되는지

브라우저/HTTP 클라이언트에서 `/ai/chat?message=...`를 호출하면 AI 응답이 문자열로 내려옵니다.

### 여기서 기억할 점

- 1편은 `ChatClient` 중심으로 시작합니다.
- `call().content()` 체인만 이해해도 첫 단계는 충분합니다.

---

## 4. 프롬프트를 조금 더 실용적으로 다루기

### 왜 필요한지

실무에서는 사용자 질문만 보내기보다, 시스템 규칙(System Prompt)을 함께 주는 경우가 많습니다.
답변 톤이나 형식을 일정하게 만들 수 있기 때문입니다.

### 무엇을 하는지

- System 역할: 답변 스타일/제약 조건 정의
- User 역할: 실제 사용자 질문 전달

### 어떻게 구현하는지

```java
@GetMapping("/ai/chat/guide")
public String guidedChat(@RequestParam String message) {
    return chatClient.prompt()
            .system("너는 백엔드 기술 튜터다. 답변은 한국어로, 핵심 먼저 3줄 이내로 요약한다.")
            .user(message)
            .call()
            .content();
}
```

이 코드의 역할: 같은 질문이어도 시스템 지시를 통해 응답 품질과 형태를 일관되게 유지합니다.

### 실행하면 무엇이 되는지

`/ai/chat/guide`는 일반 `/ai/chat`보다 답변 형식이 안정적입니다.
이 패턴이 다음 편에서 다룰 Prompt Template의 출발점입니다.

### 여기서 기억할 점

- System과 User를 분리하면 프롬프트 관리가 쉬워집니다.
- 하드코딩 문자열은 이후 템플릿으로 분리하는 것이 좋습니다.

---

## 5. 실행과 점검 포인트

### 실행 방법

```bash
./gradlew bootRun
```

이 코드의 역할: 애플리케이션을 로컬에서 실행합니다.

### 요청 예시

```bash
curl "http://localhost:8080/ai/chat?message=Spring%20AI%20핵심%20개념%203가지만%20말해줘"
```

```bash
curl "http://localhost:8080/ai/chat/guide?message=ChatClient와%20ChatModel%20차이를%20설명해줘"
```

이 코드의 역할: 기본 챗 API와 System Prompt 적용 API를 각각 확인합니다.

### 처음 실행할 때 자주 막히는 지점

- `401/403`: API 키 오타, 키 권한 문제
- `model not found`: 모델명 오타 또는 계정에서 미지원 모델 지정
- 타임아웃: 네트워크/제공자 상태 또는 과도한 요청 크기

### 여기서 기억할 점

- 문제가 생기면 먼저 `application.yml`의 모델명과 환경변수를 확인합니다.
- 1편에서는 "응답 1회 성공"만 확인해도 충분합니다.

---

## 6. 정리와 다음 단계

이번 편에서는 Spring AI 입문에 필요한 최소 구성만 다뤘습니다.

- Spring Boot + Spring AI 스타터로 프로젝트 준비
- `/ai/chat` 최소 엔드포인트 구현
- System/User 분리로 프롬프트 품질 제어 시작

여기까지 되면, 이제부터는 기능을 얹어가는 단계입니다.

## 다음 편 예고

2편에서는 **Prompt Template를 제대로 쓰는 방법**을 다룹니다.
문자열 이어붙이기를 벗어나, 변수 바인딩 기반으로 프롬프트를 관리하는 구조로 리팩토링해보겠습니다.

## 참고한 공식 문서 주제

- Spring AI Reference: Getting Started
- Spring AI Reference: ChatClient
- Spring AI Reference: Prompt and Message Roles
- Spring Boot Reference: Externalized Configuration
- Spring Boot Reference: Building RESTful Web Services
