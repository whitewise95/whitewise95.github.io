---
layout: post
title: "[Spring AI 2편] Prompt Template 제대로 쓰기: 하드코딩 프롬프트를 템플릿으로 바꾸기"
date: 2026-04-20 00:05:00 +0900
categories: [spring-ai]
permalink: /spring-ai/spring-ai-02-prompt-template/
---

1편에서 `/ai/chat` 최소 API를 만들었다면, 이제 바로 부딪히는 문제가 있습니다.
프롬프트 문자열이 코드 곳곳에 흩어지고, 요청마다 문구를 이어 붙이다 보니 유지보수가 빠르게 어려워진다는 점입니다.

이번 2편은 Spring AI 공식 문서 기준으로 **Prompt Template**을 적용해, 하드코딩 프롬프트를 구조적으로 관리하는 방법을 다룹니다.

> 작성 시점 기준(공식 문서): Spring AI 1.1.x 안정화 라인, Spring Boot 3.5.x 라인

## 시리즈 구성

- 1편: 최소 챗 API 만들기 (`/ai/chat`)
- 2편(현재): Prompt Template 제대로 쓰기
- 3편: Advisor와 대화 메모리
- 4편: RAG 입문 (Vector Store 연결)
- 5편: Tool Calling과 MCP 기초

## 목차

1. 왜 Prompt Template가 필요한가
2. 템플릿 적용 전 코드의 한계
3. Spring AI Prompt Template 적용하기
4. System/User 분리 + 변수 바인딩
5. 실행과 테스트
6. 실무에서 바로 쓰는 정리

---

## 1. 왜 Prompt Template가 필요한가

### 왜 필요한지

입문 단계에서는 아래처럼 문자열 하나로 요청을 보내도 동작합니다.

```java
chatClient.prompt().user("질문").call().content();
```

문제는 기능이 늘어날수록 시작됩니다.

- 같은 지시문을 여러 API에서 복붙
- 변수 값(직무, 톤, 길이 제한) 치환이 문자열 결합으로 난잡해짐
- 프롬프트 변경 시 영향 범위를 파악하기 어려움

### 무엇을 하는지

Prompt Template는

- 고정 지시문(템플릿)과
- 실행 시점의 입력값(변수)

을 분리해 관리할 수 있게 해줍니다.

### 어떻게 구현하면 좋은지

- System 템플릿: 답변 정책/스타일
- User 템플릿: 실제 사용자 입력 구조화

로 분리하면 확장할 때 훨씬 안정적입니다.

### 여기서 기억할 점

- Template의 핵심은 "프롬프트를 코드가 아니라 데이터처럼 다루는 것"입니다.

---

## 2. 템플릿 적용 전 코드의 한계

### 왜 필요한지

먼저 어떤 부분이 불편한지 짚어야 개선 포인트가 명확해집니다.

### 무엇을 하는지

아래는 흔히 처음 작성하는 방식입니다.

```java
@GetMapping("/ai/chat/summary")
public String summary(@RequestParam String topic,
                      @RequestParam(defaultValue = "3") int lines) {
    String prompt = "너는 백엔드 기술 튜터야. " +
            "한국어로 " + lines + "줄 이내로 핵심만 요약해줘. " +
            "주제: " + topic;

    return chatClient.prompt()
            .user(prompt)
            .call()
            .content();
}
```

이 코드의 역할: 빠르게 동작은 하지만, 텍스트 정책과 변수 조합이 메서드 안에서 섞여 유지보수가 어려워집니다.

### 실행하면 무엇이 되는지

동작은 정상입니다. 하지만 같은 정책을 다른 API에 재사용하려는 순간, 문자열 복붙이 시작됩니다.

### 여기서 기억할 점

- "지금 동작한다"와 "나중에도 관리 가능하다"는 다릅니다.

---

## 3. Spring AI Prompt Template 적용하기

### 왜 필요한지

문자열 결합을 템플릿 + 변수 맵으로 바꾸면, 정책 변경과 재사용이 쉬워집니다.

### 무엇을 하는지

- `PromptTemplate`에 자리표시자(placeholder)를 정의
- 요청 시점에 변수 값을 주입해 최종 메시지를 생성

### 어떻게 구현하는지

아래처럼 서비스 클래스로 분리합니다.

```java
package io.whitewise95.demo.ai;

import java.util.Map;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.stereotype.Service;

@Service
public class AiPromptService {

    private final ChatClient chatClient;

    public AiPromptService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public String summarize(String topic, int lines, String level) {
        PromptTemplate systemTemplate = new PromptTemplate(
                """
                너는 백엔드 기술 멘토다.
                답변은 한국어로 작성한다.
                설명 난이도는 {level} 기준으로 맞춘다.
                불필요한 서론 없이 핵심부터 전달한다.
                """
        );

        PromptTemplate userTemplate = new PromptTemplate(
                """
                아래 주제를 {lines}줄 이내로 요약해줘.
                주제: {topic}
                """
        );

        String systemMessage = systemTemplate.render(Map.of("level", level));
        String userMessage = userTemplate.render(Map.of(
                "lines", lines,
                "topic", topic
        ));

        return chatClient.prompt()
                .system(systemMessage)
                .user(userMessage)
                .call()
                .content();
    }
}
```

이 코드의 역할: 프롬프트 정책(템플릿)과 입력값(변수)을 분리해 재사용 가능한 호출 구조를 만듭니다.

### 실행하면 무엇이 되는지

같은 메서드로도 `lines`, `level`, `topic` 값만 바꿔 다양한 결과를 안정적으로 생성할 수 있습니다.

### 여기서 기억할 점

- PromptTemplate는 "문자열 치환"이 아니라 "프롬프트 설계 단위"로 생각하면 좋습니다.

---

## 4. System/User 분리 + 변수 바인딩

### 왜 필요한지

실무에서 응답 품질이 흔들리는 가장 큰 원인은 System과 User의 역할이 섞이는 것입니다.

### 무엇을 하는지

- **System**: 항상 지켜야 할 룰 (톤, 금지사항, 포맷)
- **User**: 매 요청마다 달라지는 입력

으로 분리합니다.

### 어떻게 구현하는지

```java
package io.whitewise95.demo.ai;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AiTemplateController {

    private final AiPromptService aiPromptService;

    public AiTemplateController(AiPromptService aiPromptService) {
        this.aiPromptService = aiPromptService;
    }

    @GetMapping("/ai/chat/template")
    public String chatWithTemplate(
            @RequestParam String topic,
            @RequestParam(defaultValue = "3") int lines,
            @RequestParam(defaultValue = "junior") String level
    ) {
        return aiPromptService.summarize(topic, lines, level);
    }
}
```

이 코드의 역할: 사용자 입력(topic/lines/level)을 받아 템플릿 기반 프롬프트로 안전하게 AI 요청을 보냅니다.

### 실행하면 무엇이 되는지

이제 API 호출자는 값만 넘기고, 프롬프트 구조는 서버에서 일관되게 유지됩니다.

### 여기서 기억할 점

- 컨트롤러에서는 입력 검증과 전달에 집중하고,
- 템플릿/프롬프트 조립 책임은 서비스에 두는 편이 유지보수에 유리합니다.

---

## 5. 실행과 테스트

### 실행 방법

```bash
./gradlew bootRun
```

이 코드의 역할: 애플리케이션을 실행해 템플릿 기반 엔드포인트를 테스트할 수 있게 합니다.

### 요청 예시

```bash
curl "http://localhost:8080/ai/chat/template?topic=Spring%20AI%20Prompt%20Template&lines=4&level=junior"
```

```bash
curl "http://localhost:8080/ai/chat/template?topic=Batch%20와%20Scheduler%20차이&lines=2&level=senior"
```

이 코드의 역할: 동일한 API 구조에서 변수만 바꿔 결과 품질과 톤이 달라지는지 확인합니다.

### 처음 자주 겪는 문제

- 템플릿 변수 오타: `{line}` vs `lines`
- 필수 파라미터 누락: `topic` 없음
- System 지시 과다: 제약이 너무 많아 응답이 부자연스러움

### 여기서 기억할 점

- 템플릿 변수명은 상수처럼 관리하면 실수가 줄어듭니다.
- System 메시지는 짧고 명확할수록 효과적입니다.

---

## 6. 실무에서 바로 쓰는 정리

이번 편의 핵심은 세 가지입니다.

1. 하드코딩 프롬프트를 Prompt Template로 분리
2. System/User 역할 분리로 응답 일관성 확보
3. 컨트롤러와 프롬프트 조립 책임을 분리해 구조 안정화

이 상태만 만들어도, 다음 단계(메모리/어드바이저/RAG)로 확장할 때 코드가 훨씬 덜 흔들립니다.

## 다음 편 예고

3편에서는 **Spring AI Advisor와 대화 메모리**를 다룹니다.
같은 사용자 대화 문맥을 어떻게 유지하고, 어떤 책임을 Advisor로 분리하면 좋은지 실습 중심으로 이어가겠습니다.

## 참고한 공식 문서 주제

- Spring AI Reference: Prompt
- Spring AI Reference: PromptTemplate
- Spring AI Reference: ChatClient
- Spring Boot Reference: Externalized Configuration
- Spring Boot Reference: REST API 개발 기본
