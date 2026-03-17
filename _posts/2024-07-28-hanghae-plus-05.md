---
layout: post
title: "[항해플러스:백엔드] 4~5주차 - 서버구축 챕터 개발기"
date: 2024-07-28 00:00:00 +0900
categories: [항해플러스]
tags: [항해플러스, 백엔드, 회고]
permalink: /hanghae-plus/hanghae-plus-05/
---

> 원문: https://velog.io/@whitewise95/항해플러스백엔드-4주차-TDD-레이어드아키텍처을-활용한-기능-개발기

# 1. 들어가는 말

## 📕 4주차 과제 내용
✅ Swagger 작성
✅ 주요 비즈니스 로직 개발 및 단위 테스트 작성
✅ Usecase 별 통합 테스트 작성

지난 주에는 잔액 충전 / 조회, 주문 / 결제, 상품 조회, 상위 상품 조회, 장바구니 API들에 대한 마일스톤, 시퀀스 다이어그램, ERD, API 명세서를 작성하고 Mock API를 생성하는 것을 목표로 삼았다. 이번 주는 해당 API들을 레이어드 아키텍처(원하는 아키텍처를 사용)와 TDD로 기능 개발을 하는 것이 목표였다.

나는 이번에 service 로직의 복잡성을 낮추기 위해 service 레이어 앞에 Facade Pattern을 적용해 application 계층을 두고 개발을 진행했다.

## 📕 5주차 과제 내용
✅ 필요한 Filter, Interceptor 등의 기능 구현
✅ 예외 처리, 로깅 등 유효한 부가 로직의 구현
✅ 전체적으로 어플리케이션 완성하기(모든 API 동작하도록)

5주차 과제는 filter와 interceptor를 적용시키고, 로그가 필요한 부분에 로그 처리를 하는 것이었다. filter, interceptor를 어떤 패키지에 위치시켜야 할지? filter, interceptor는 각 어떤 책임을 맡는지? 고민을 하면서 개발을 진행했다.

## 📕 4~5주차 목표
- 기능 개발을 TDD 방법론으로 해보기 (모든 계층의 단위, 통합 테스트)
- 레이어드 아키텍처 + DIP를 적용한 아키텍처에 익숙해지기
- 파사드 패턴에 익숙해지기
- filter, interceptor에 대한 각 책임을 잘 분리해서 적용해보기
- 로그를 적절한 레벨로 적용시키기



# 2. 개발기

## 📕 swagger 
위 글에서는 적지 못했지만 스웨거를 적용시켜서 API문서화 하라는 요구사항이 있었다.
스웨거는 SpringFox 는 사용해봤지만 SpringFox는 업데이트를 중단되어서 
SpringDoc를 사용하기로 했다. 


gradle은 2.6 버전을 사용했다.
```
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")
```

config는 많은 자료들이 있어서 큰 어려움 없이 설정할 수 있었던거 같다.

```java
@Configuration
public class SwaggerConfig {

  @Bean
  public OpenAPI openAPI() {
    return new OpenAPI()
        .components(new Components())
        .info(apiInfo());
  }

  private Info apiInfo() {
    return new Info()
        .title("Springdoc Swagger")
        .description("Springdoc을 사용한 Swagger UI")
        .version("1.0.0")
        .license(new License().name("Apache 2.0").url("http://springdoc.org"));
  }
}
```


SpringFox 에서 SpringDoc로 마이그레이션하는 부분은 https://springdoc.org/ 에 잘 나와있어서 크게 힘든 점은 없었던 것 같다.  

![](https://velog.velcdn.com/images/whitewise95/post/ccb155ed-1186-4e17-a627-470d531e4bbf/image.png)


조금 힘들었던 부분이 yml 파일에 작성해줘야하는 설정이 있는데 많은 자료에서 다르게 적용시켜놓고 개발자 입맛대로 수정해놓은 부분이 있어서 제대로 파악하기 힘들어서 시간이 좀 걸렸지만 그래도 잘 설정한 것 같다.

```yml
springdoc:
  show-actuator: true
  swagger-ui:
    path: /swagger-ui.html
  api-docs:
    path: /api-docs

```

### controller
controller 에서는 ApiResponse를 이용해 오류에 대한 명세를 했고 Operation와 Tag를 통해 API와 클래스에 대해서 정의했다. 
```java
  @Operation(summary = "주문하기")
  @ApiResponses(value = {
      @ApiResponse(responseCode = "404", description = "유저정보 or 상품정보가 존재하지 않습니다."),
      @ApiResponse(responseCode = "400", description = "{상품명}이 품절 상태 입니다.")
  })
  @PostMapping
  public OrderResponse create(
```

![](https://velog.velcdn.com/images/whitewise95/post/2aa92c48-b019-4a23-ae81-db8df9b8dc58/image.png)

### DTO 
dto는 Schema를 사용해 DTO 클래스의 정의와 필드의 정의를 해줬다.
```java
  @Getter
  @Setter
  @Schema(name = "주문 생성 DTO")
  public static class OrderCreate {

    @Schema(description = "유저 고유번호", defaultValue = "1")
    private Long userId;

    @Schema(description = "주문할 상품 목록")
    private List<OrderProductCreate> productList = new ArrayList<>();
  }
```

![](https://velog.velcdn.com/images/whitewise95/post/c545ac71-fcc4-4eb6-a54f-6aa6b1a06ed7/image.png)



## 📕 패키지 구조

### 아키텍처
나는 레이어드 아키텍처를 사용해 개발을 진행했고, presentation, application, business, infrastructure 레이어로 구성했다. 최대한 트랜잭션은 business 레이어에 위치하도록 하였으며, application 레이어에서 여러 작업들이 하나의 단위로 묶여야 하는 경우에는 보상 트랜잭션을 직접 구현하기보다는 트랜잭션을 application 레이어에 걸어 사용했다.

application 레이어에는 Facade 패턴을 적용하여 useCase를 작성하고, business 레이어에는 각 파사드가 사용하는 비즈니스 로직들이 작성되어 있다.

계층은 아래와 같이 구성했다.

![](https://velog.velcdn.com/images/whitewise95/post/885deaee-a799-4a4d-9813-f43955336d49/image.png)


## 📕 TDD 
이번에는 5~6개가 넘는 API를 개발하는 과정에서 repository를 제외한 3개의 레이어에 대한 모든 유닛 테스트와 통합 테스트를 TDD 방식으로 구현하느라 힘들었다. 😅

성공 케이스를 위한 테스트 코드(이하 TC)를 작성한 후 비즈니스 로직을 개발하고, 실패 케이스를 위한 TC를 작성한 뒤 비즈니스 로직의 예외 처리를 개발하는 순서로 TDD를 진행했다.

각 API는 3개의 레이어를 가지고 있어서 실패 케이스와 성공 케이스에 대한 TC가 각각 하나씩만 있더라도 총 6개의 TC가 필요했다. 이 때문에 API 하나를 개발하는 데 상당한 시간이 소요되었다.

다행히도, 자신의 고유 로직이 없는 메소드에 대해서는 테스트를 할 필요가 없다는 코칭을 받은 적이 있어서, 고유 로직이 없는 경우에는 테스트를 생략했다.

예를 들어, 아래 코드를 보면 Facade 패턴을 사용했지만 바로 service의 로직에 의존하는 것을 볼 수 있다. 이외에 추가적인 로직이 존재하지 않기 때문에 고유 로직이 없다고 할 수 있다. 이런 경우에는 사실상 service만 테스트해도 무방하다.
![](https://velog.velcdn.com/images/whitewise95/post/50248004-951f-440a-b254-a56db3d74722/image.png)


![](https://velog.velcdn.com/images/whitewise95/post/13fb81f7-d3d4-4a3a-bb4e-f6bd1333a0bd/image.png)


## 📕  filter, interceptor

`filter의 경우 요청과 응답을 거른뒤 정제하는 역할` (인코딩 변환 ,XSS 등의 방어와 Dispatcher Servlet에 요청이 전달되기 전/후에 url 패턴에 맞는 모든 요청에 대해 부가 작업을 처리)를 하고  `interceptor는 스프링 내부 컨텍스트이며, 요청에 대해 요청 부터 컨트롤러 전 가로채고 컨트롤러 리턴 후  client 로 리턴되기전 또 가로챌 수 있다.` 

또 다른 점이라면, 필터는 Request와 Response를 조작할 수 있지만, interceptor는 조작할 수 없다고 한다. 


나는 filter를 요청과 응답에 대한 로그를 남기는 LogFilter를 만들고, 로그인기능을 만들어 JWT를 client에 응답해주고 모든 요청에 JWT를 헤더로 넘겨 받아 interceptor에서 확인하는 구조로 개발해보기로 했다.



## 📕 filter 
ServletRequest, ServletResponse로 요청과 응답에 대한 헤더와 바디 또는 파라미터와 uri 까지 로그로 찍어주도록 개발했다.

```java
@WebFilter
@Slf4j
public class RequestResponseLoggingFilter implements Filter {

  @Override
  public void init(FilterConfig filterConfig) {
    log.info("RequestResponseLoggingFilter initialized");
  }

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain) {
   ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper((HttpServletRequest) request);
    ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper((HttpServletResponse) response);

    try {
      log.info("Request Method: {}", requestWrapper.getMethod());  // 메소드
      log.info("Request URI: {}", requestWrapper.getRequestURI());   // URI

      // Header 
      requestWrapper.getHeaderNames().asIterator().forEachRemaining(header ->
          log.info("Request Header {}: {}", header, requestWrapper.getHeader(header))
      );

      // Parameter
      requestWrapper.getParameterNames().asIterator().forEachRemaining(param ->
          log.info("Request Parameter {}: {}", param, requestWrapper.getParameter(param))
      );

      long start = System.currentTimeMillis();
      filterChain.doFilter(requestWrapper, responseWrapper);
      long end = System.currentTimeMillis();

    // Request Body
      String requestBody = new String(requestWrapper.getContentAsByteArray(), StandardCharsets.UTF_8);
      log.info("Request Body: {}", requestBody);

   // Response Body
      String responseBody = new String(responseWrapper.getContentAsByteArray(), StandardCharsets.UTF_8);
      log.info("Response Body: {}", responseBody);

      responseWrapper.copyBodyToResponse();

      log.info("Response Status: {}", HttpStatus.valueOf(responseWrapper.getStatus()));
      log.info("Response Time: {} ms", (end - start));
    } catch (Exception e) {
      log.error("Failed to log request/response", e);
    }
  }

  @Override
  public void destroy() {
    Filter.super.destroy();
  }
}
```

## 📕 interceptor 
jwt를 검사하고 해당 payload의 값을 객체로 만들고 `request.setAttribute(TOKEN_INFO, tokenInfo);` 한다음 controller에서 `@RequestAttribute(value = TOKEN_INFO) TokenInfoDto tokenInfoDto,` 로 받을 수 있게 처리했다. 

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenInterceptor implements HandlerInterceptor {

  public final static String TOKEN_INFO  =  "tokenInfo";
  private final JwtTokenProvider jwtTokenProvider;

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws AuthenticationException {

    String authorization = request.getHeader(JWT_HEADER_KEY);

    if (authorization == null) {
      throw new AuthenticationException("authorization가 없습니다.");
    }

    jwtTokenProvider.isBearerToken(authorization);

    String accessToken = authorization.substring(7);
    Claims decodeToken = jwtTokenProvider.getClaimsFormToken(accessToken);

    TokenInfoDto tokenInfo = new TokenInfoDto(
        decodeToken.get(CLAIMS_KEY_USER_NAME).toString(),
        (Long) decodeToken.get(CLAIMS_KEY_USER_ID)
    );

    request.setAttribute(TOKEN_INFO, tokenInfo);
    return true;
  }
}
```

```java
  @PostMapping
  public CartResponse create(
      @RequestAttribute(value = TOKEN_INFO) TokenInfoDto tokenInfoDto,
      @RequestBody CartCreate create
  ) {
    return CartResponseDtoMapper.toCartResponse(cartFacade.addCart(tokenInfoDto.getUserId(), CartRequestDtoMapper.toCreate(create)));
  }
```

# 3. 아고라 
slack에 항플 워크스페이스가 있는데 그 중에 공유하고 싶은 내용이나 질문이 있을 내용을 올리는 아고라 채널이 존재한다.

이번에 파사드패턴을 사용하는 사람들이 많은데 파사드에 Transaction을 걸어야할지 서비스에 걸어야할지 고민이 많은 것 같았다. 

Transaction은 하위 레이어에 걸면 걸수록 좋은데 그것에 대해서 여러 서비스들을 사용하는 Facade에서 트랜잭션을 걸지 않는다면 원자성을 어떻게 보장하는지에 대한 내용이 아고라에 올라온 것이다. 

그 내용을 작성한 최병호님의 허락을 받고 이렇게 공유하게 되었다.

## 📕 캡쳐
![](https://velog.velcdn.com/images/whitewise95/post/6982f844-7f73-44c9-a11d-7ef8637961b4/image.png)

## 📕 TEXT
안녕하세요 개발자 여러분. 이제 과정 절반을 지나가고 있네요. 저는 지금까지 정말 많은 챌린지들과 어려움들이 있다고 생각해요. 어떤 우여곡절이 됐든! 절반까지 해내신 동료 여러분들 모두 대단하십니다. 코치님들과 5기 분들 모두 존경합니다!!!
오늘 조원들과 이야기를 나누다가 @Transactional 애노테이션은 어디에 있는 게 맞냐? 는 내용으로 열띤 토론을 나눴는데요.
코치님들과 다른 동료분들은 어떤 생각을 하시는지 궁금해서 글을 올려봅니다.
먼저, 저는 이렇게 생각해요.
결론부터 말하자면, 저는 트랜잭션 애노테이션은 서비스에 있어야 한다고 생각합니다. 그리고 파사드나 레포지토리에 다른 트랜잭션이 있어서는 안 된다고 생각합니다.
제가 그렇게 생각한 이유를 이야기해볼게요.
예약이라는 api 를 예로 들어 볼게요. 조금 다를 수 있지만 문제 정의를 위해 예약에는 여러 기능이 아래와 같이 포함되고, 각각은 동기적으로 연결되어야 한다고 해 볼게요.
- 결제 처리
- 예약 처리
- 토큰 처리
이와 같은 기능들은 논리적으로 한 단위의 원자성을 가져야 합니다. 즉, 하나의 트랜잭션으로 묶여야 합니다. 결제, 예약, 토큰 각각은 자율성과 책임을 부여받은 온전한 도메인입니다. 따라서 개별적인 서비스들, 예를 들어 PaymentService, ReservationService, TokenService 는 각각의 도메인에서 응집도를 가지고 있습니다. 이러한 도메인 서비스들은 각자의 비즈니스 로직과 데이터베이스 커넥션, 커밋, 롤백을 처리하는 책임을 집니다. 따라서 각 도메인 서비스는 그 스스로 책임지는 기능에 대한 원자성, 즉 트랜잭션을 가져야 하겠죠.
이와 같은 이유로 트랜잭션 애노테이션은 서비스 계층에 위치해야 합니다. 서비스 계층에서 변경을 포함하는 기능을 하나의 트랜잭션으로 묶어야 해당 도메인이 스스로 책임지는 기능에 대한 논리적인 원자성을 보장받을 수 있는 거죠. 그리고 전체 코드의 일관성을 위해서도 도움이 되구요.
그렇다면, 파사드 수준에서 여러 기능을 하나의 논리적 단위로 묶는 트랜잭션은 어떻게 해야 할까요? 눈치채셨을 수도 있는데, 앞서 @Transactional 애노테이션을 언급한 것은 스프링의 트랜잭션 애노테이션임을 강조드렸던 것인데요. 애노테이션을 사용한 트랜잭션과 논리적인 트랜잭션의 개념을 구분해야 합니다. 논리적 원자성을 보장하기 위해 파사드는 트랜잭션이 필요하지만, 반드시 스프링이나 Jakarta의 애노테이션을 사용할 필요는 없는 것입니다.
트랜잭션 애노테이션이 서비스가 아닌 다른 곳에 있으면 안 되는 이유는 다음 이유 때문입니다.
1. DB 커넥션의 범위가 트랜잭셔널 하지 않게 넓어진다.
2. 스프링 트랜잭션의 전파(propagation) 기본 설정이 REQUIRES 이기 때문에, 서비스 간의 트랜잭션 경계가 없어지고 서비스의 응집도가 떨어집니다.
예를 들어, ‘반드시 기록해야 하는 로그 기록’이라는 새로운 기능이 추가된다고 가정해 볼게요. 그런데 이 로그 기록 로직이 타 마이크로 서비스, 혹은 우리 회사가 아닌 다른 회사의 기능이라면 어떨까요?
이때 문제가 발생해요. 이 기능이 타 회사의 서비스와 연동된다면, 네트워크 I/O가 발생하게 되겠죠. DB 커넥션 컨텍스트가 네트워크 I/O를 포함하여 타 회사의 비즈니스 로직까지 확장됩니다.
그러면 어떤 문제가 발생할까요? 요청이 쇄도하는데 응답이 지연된다면 커넥션 풀이 고갈될 위험이 있을 것 같아요. 타 회사의 장애로 인해 우리 서비스의 latency가 증가할 수도 있고, 장애가 전파되어 전체 서비스에 영향을 끼칠 수도 있겠죠.
즉, 스프링 트랜잭션 범위가 넓어지면 시스템이 불안정해지고, 트랜잭션 컨텍스트가 모호해지며 잠재적인 문제를 갖게 됩니다.
그렇다면 어떻게 해야 할까요? 이처럼, 본인이 책임지는 서비스 바깥까지 기능적인 수요에 따라 트랜잭션이 필요한 경우, 수동으로 트랜잭션을 구현해야 한다고 생각합니다. 그 방식으로 이벤트를 사용할 수도 있을 것이고, 보상 트랜잭션을 사용할 수도 있을 것입니다. 기술적인 기법들이 필요한 지점입니다. 예를 들어 이벤트 처리, 보상 트랜잭션 같은 메커니즘을 사용할 수 있을 것 같아요.
이에 대한 고민으로 등장하는 것이 사가 패턴이나 인박스/아웃박스 패턴이 아닐까 싶어요.
- 사가 패턴: 분산 트랜잭션을 관리하기 위한 패턴으로, 각 단계가 성공하면 다음 단계로 넘어가고, 실패하면 보상 작업을 수행합니다.
- 인박스/아웃박스 패턴: 데이터베이스의 일관성을 유지하기 위해, 이벤트를 데이터베이스 내에서 관리하고 처리하는 패턴입니다.
이 관점에서 저는 파사드를 모놀리틱 어플리케이션 내에서 사가 패턴을 구현하는 접근이라고 생각해요.
파사드가 여러 도메인 서비스를 하나의 유스케이스로 묶어주는 역할을 한다면, 사가 패턴이 분산 환경에서 개별 서비스의 트랜잭션을 조정하는 것과 유사합니다. 각 서비스의 트랜잭션을 논리적으로 묶어 처리함으로써, 실패 시 보상 작업을 통해 일관성을 유지하는 방식은 모놀리틱 환경에서 사가 패턴의 역할을 수행한다고 볼 수 있는 거죠.
결론적으로, 따라서, 서비스 바깥에서도 트랜잭션이 필요할 경우 수동으로 트랜잭션을 구현해야 합니다.
당연히 어려운 문제라고 생각해요.
제가 가진 관점을 설명해보았습니다. 잘못 생각하고 있거나 틀렸다면 다른 생각을 해보고 싶어서 의견을 공유드렸어요. 여러분들의 생각은 어떠신가요? 마구마구 지적하고 좋은 방향을 제시해주시면 성장하는 데 많은 도움이 될 거 같아요! 감사합니다!!!



## 📕 인상깊었던 답변
인상깊었던 답변이 있었는데 이석범코치님이 답변을 남겨주신 내용이다.  
공감도 되고 개발을 할 때 정말 확장성있게 개발을 한다는 말이 무엇인지 알 수 있게 해주는 말인 것 같다는 생각을 했다. 
![](https://velog.velcdn.com/images/whitewise95/post/5dd94d78-1aaf-4f91-bc6c-e28863747f82/image.png)


# 4. 마무리
피어리뷰로 이런 리뷰가 달렸다. 
![](https://velog.velcdn.com/images/whitewise95/post/a4d3135e-b973-4d10-a094-9c335b55d026/image.png)

해당 PR의 step은 presentation과 application이 연결하는 step이 아니라서 생략했지만, 리뷰어 입장에서는 저런 리뷰가 당연한 것 같다. PR을 날릴 때 주의할 점이나 리뷰 전 알아야 할 내용을 PR에 같이 올려주는 것도 좋을 것 같다는 생각을 했다.

그리고 entity 같은 경우에는 JPA를 사용하고 있어서 더티 체킹이나 객체 생성이 생성자를 통해서만 이루어지고 있는데, DTO에는 Setter를 사용하고 있어서 DTO도 Setter를 사용하는 게 어떤지 리뷰를 남겨주셨다.

맞는 말이다. DTO이니깐 괜찮겠지? 라는 귀찮음이 Setter를 사용하게 된 것 같다.
그런데 요즘 record에 흥미가 많이 생겨서 DTO를 record로 만들까 고민도 있다.

게다가 테스트 코드가 가독성이나 재사용성이 매우 떨어지는 느낌이 드는데, 이런 부분은 리팩토링을 통해서 많이 고쳐보고 재사용성이나 가독성을 높여야겠다.


 
