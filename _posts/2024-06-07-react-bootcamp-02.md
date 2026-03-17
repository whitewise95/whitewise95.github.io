---
layout: post
title: "[내배캠: 리액트과정] 8일간 뉴스피드 프로젝트 개발기"
date: 2024-06-07 00:00:00 +0900
categories: [리액트 부트캠프]
tags: [리액트, 내일배움캠프, 프로젝트, 회고]
permalink: /react-bootcamp/react-bootcamp-02/
---

> 원문: https://velog.io/@whitewise95/내배캠-리액트과정-8일간-뉴스피드-프로젝트-후기

## 글 소개

리액트를 배우고 첫 팀 프로젝트를 시작하게 되었다. 개발이란 몰입이 중요하다고 생각하는 나에게, 개발을 한다는 것 자체가 설레는 일이었지만, 한편으로는 경력이 있어서 팀에 더 큰 기여를 하고 실력을 끌어올려야 한다는 부담도 있었다.아직 리액트를 배우는 단계이기에 깊게 

## 본문

![](https://velog.velcdn.com/images/whitewise95/post/3af8ff7b-2f0b-4122-80a5-933ca9121fe2/image.jpeg)


---

# 1. 들어가는 말
리액트를 배우고 첫 팀 프로젝트를 시작하게 되었다. 개발이란 몰입이 중요하다고 생각하는 나에게, 개발을 한다는 것 자체가 설레는 일이었지만, 한편으로는 경력이 있어서 팀에 더 큰 기여를 하고 실력을 끌어올려야 한다는 부담도 있었다.

아직 리액트를 배우는 단계이기에 깊게 모르는 지식으로 불확실한 정보를 전달할까 걱정도 있었다. 5월 31일부터 6월 7일까지 뉴스피드 프로젝트의 진행 상황과 개발 과정을 적어보려고 한다.

---

# 2. 프로젝트 과정

## ▶︎ 팀장으로써
나는 이전 팀에서 두 번 팀장을 맡았고, 두 번 다 발표를 했다. 
비록 발표에 울렁증이 있지만 최선을 다했다. 😅

![](https://velog.velcdn.com/images/whitewise95/post/c8282668-aa6c-4ffe-a998-dcf3a6291eb5/image.png)

자리가 사람을 만든다고, 내가 하고 싶어서 팀장이 된건 아니지만 맡게 되면 최선을 다하는 것 같다.

이번 프로젝트에서도 팀장을 맡게 되었고, 리액트로는 첫 프로젝트이기도 했다. 팀원들의 이야기를 들어보니 아직 리액트는 물론 JavaScript조차 어려워하는 경우가 많았다. 그래서 이번 프로젝트의 목표는 실력이 좋은 팀원은 기본을 다지는 시간을, 실력이 부족한 팀원은 기본기를 향상시키는 데 두고 싶었다.

나는 팀원들이 개발에만 집중할 수 있도록 하고 싶었다. 예를 들어, 개발의 한 부분일 수도 있겠지만 Git 컨벤션이나 코드 컨벤션을 좀 더 엄격하게 정했지만, 지키지 못해도 큰 의미를 두지 않고, 효율이 나쁜 코드여도 기능이 작동하는 코드를 작성할 수 있다는 것에 의미를 두고 싶었다.


## ▶︎ 기획
내배캠에서의 요구사항은 아래와 같다.
✅ 내 게시물을 포함한 모든 게시물을 볼 수 있는 공간의 컨셉으로 기획
✅ 로그인, 회원 가입, CRUD, 마이페이지, 배포하기, git활용을 필수로 구현

![](https://velog.velcdn.com/images/whitewise95/post/0f4b6194-afd0-4015-a9c1-bae5019d5182/image.png)

바로 팀회의가 시작되었고 2개의 의견이 나왔다.
두 의견을 합쳐서 미니홈피감성에 트랜디함을 추가한 뉴스피드 사이트를 제작을 의도하면서 기획이 추가 되었다.


그리고 빠르게 기능을 나열하고 와이어프레임을 그리고 담당하는 부분들을 나눴다. 
![](https://velog.velcdn.com/images/whitewise95/post/a5a4cf9b-66b5-428d-b0a0-06a64300d215/image.png)

![](https://velog.velcdn.com/images/whitewise95/post/a489a722-9828-4529-8da9-79e252bed8b2/image.png)

![](https://velog.velcdn.com/images/whitewise95/post/58986d04-72da-43ce-9ad5-dc68e3a1ca25/image.png)



## ▶︎ 레이아웃
아래와 같이 우리는 A,B 레이아웃 두개의 레이아웃이 필요하며 라우터에 각각 다른 레이아웃을 적용해야했다.
![](https://velog.velcdn.com/images/whitewise95/post/76d5b7bf-d86e-497b-9047-06a4d3ec6882/image.png)


그렇게 방법을 알아보고...
![](https://velog.velcdn.com/images/whitewise95/post/1122f361-61a0-4094-a3df-8b911f4a6880/image.png)

중첩라우터 라는 키워드를 얻게 되었고 적용시켜봤더니 성공했다. [중첩라우터 참고한 블로그 글](https://velog.io/@river-m/%EB%A6%AC%EC%95%A1%ED%8A%B8-%EB%9D%BC%EC%9A%B0%ED%84%B0-V6.4-%EC%A4%91%EC%B2%A9%EB%9D%BC%EC%9A%B0%ED%8A%B8-Layout-outlet)

```jsx
 <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ProfileDetailPage" element={<ProfileDetailPage />} />
        
        <Route element={<AuthDefaultLayout />}>
          <Route path="/login" element={<LoginMainPage />} />
          <Route path="/login/email" element={<LoginPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/join/info" element={<SetUserData />} />
          <Route />
        </Route>

        <Route element={<BlogLayout />}>
          <Route path=":userId/blog/posts" element={<PostsPage />} />
          <Route path=":userId/blog/posts/:postId" element={<PostDetailPage />} />
          <Route path=":userId/blog/posts/create" element={<PostCreatingPage />} />
          <Route path=":userId/following" element={<FollowPage />} />
          <Route path=":userId/blogs" element={<BlogListPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
```


## ▶︎ DB(Supabase)의 조인
DB는 supabase를 사용해서 데이터를 적재하라는 요구사항이 있어서 supabase를 사용했다.
팔로우 목록 페이지에서는 자신이 팔로우한 회원들의 목록들이 목록으로 조회되는데 ERD 아래와 같다.
![](https://velog.velcdn.com/images/whitewise95/post/bb47f41d-e1b3-4b6d-91ef-ee2b329d732e/image.png)

follow 테이블에서 목록을 조회하고 해당 following_user_id를 in절로 user 테이블에서 유저들의 정보를 조회해야하는 상황이 발생했다. 

조인으로 해결하고 싶었기에 supabase에 조인이 되나 확인 하던 중 SQL Editor 라는 메뉴를 확인했다.
![](https://velog.velcdn.com/images/whitewise95/post/27d9130b-9ffc-4f35-9fa5-de33187e1bbf/image.png)

sql은 경험이 있어서 손 쉽게 쿼리할 수 있었다.
![](https://velog.velcdn.com/images/whitewise95/post/45df25bf-a1fe-4911-a302-5a149ba1c065/image.png)

근데 이걸.... 로직으로 어떻게 연결하지?.... supabase의 document를 계속 읽는 시간을 가졌다
![](https://velog.velcdn.com/images/whitewise95/post/1122f361-61a0-4094-a3df-8b911f4a6880/image.png)

알아보니 supabase로 쿼리한 걸 사용하려면 supabase의 언어를 사용해 쿼리의 이름을 지어줘야하고 파라미터를 정의할 수도 있었다.

```sql
-- 기존 함수를 삭제하는 명령어
DROP FUNCTION IF EXISTS fetch_user_follows(param UUID, keyword VARCHAR);

-- 새로운 함수를 생성 fetch_user_follows 부분이 함수명을 정해준다.
CREATE OR REPLACE FUNCTION fetch_user_follows (
  param UUID,
  keyword VARCHAR
) RETURNS TABLE (
  user_id UUID,
  profile_image VARCHAR,
  blog_name VARCHAR,
  nickname VARCHAR,
  followers_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id, 
    u.profile_image AS profile_image, 
    u.blog_name AS blog_name, 
    u.nickname AS nickname, 
    u.followers_count AS followers_count 
  FROM 
    "FOLLOW" AS f
    INNER JOIN "USERS" AS u ON u.id = f.following_user_id
  WHERE 
    f.user_id = param
    AND u.blog_name LIKE '%' || keyword || '%';
END;
$$ LANGUAGE plpgsql;
```

> js에서 사용하는 방법은  rpc라는 함수를 사용해 쿼리에 명시해준 함수명과 파람 변수명을 넣어서 통신할 수 있다.
```js
   supabase.rpc('fetch_user_follows', {
        param: userId,
        keyword: searchKeyword,
      }).then(response => {
          if (!response.error){
            setFollowList(response.data?.map(follow => {
              return {
                id: follow.user_id,
                profileImage: follow.profile_image,
                blogName: follow.blog_name,
                followersCount: follow.followers_count,
              };
            }));
          }
      });
```


![](https://velog.velcdn.com/images/whitewise95/post/b4d7e57c-0306-4f9a-b19f-498bae8060ec/image.png)




이렇게 글을 적으니 한방에 된 것 같지만 3시간 정도의 삽질을 했다.... 🙃




## ▶︎ 담당 개발 완료

![](https://velog.velcdn.com/images/whitewise95/post/ed60b2e2-e473-4965-b94d-10bbd0961d99/image.png)

개발 시작 4일차인 목요일은 현충일이라 수요일까지 담당하는 기능을 전부 완료하자는 목표로 개발을 진행했고 완료가 되었다 

전 개인과제에서 사용하던 기술을 거의 비슷하게 사용하기에 기능구현에는 큰 트러블 슈팅없이 완료했다. 
![](https://velog.velcdn.com/images/whitewise95/post/fa838182-9d3f-4097-9a09-6d0c9aeac1e0/image.png)

그리고 목요일은 제출 자료 및 아직 완성하지 못한 팀원들을 서포트해야겠다 생각했다.
![](https://velog.velcdn.com/images/whitewise95/post/2295b24f-e46f-4f85-8bf0-0207807dae2a/image.png)




## ▶︎ 오랜만에 밤샘작업

제출자료 검토좀 해야겠다하고 마음으로 목요일 오후 11시30분쯤 다시 zep을 접속하는데 팀원 중 한분이 있길래 잘 진행되고 있는지 여쭤봤지만 코드를 한 줄도 쓰지 못한 것 이다.

당장 내일 오후12시에 제출인데... 생각이 많아졌다.

그냥 내가 기능구현을 해드리고 `그 코드를 이해할 수 있도록 공부하라고 할까?`, `내가 다 해주면 A님은 다음 프로젝트는 어떻게 혼자 나아가지?` 등등 정말 많은 생각이 든 것 같다.

결국은 직접 쳐보는게 도움이 되고 머리속에 남게될 것 같아서 하나씩 하나씩 코멘트를 해드리면서 직접 팀원이 코드를 작성하도록 했고 새벽 5시 기능구현이 완료되었다.

오전에 할 일이 많기에 조금이라도 자야한다는 생각해 빨리 잠에 들었고 오전 7시에 일어나 코드를 합치고 배포하고 제출자료 준비하고 그리고 발표를 끝으로 프로젝트가 끝났다.




# 3. 부족한 점
백엔드로 근무한 경험이 있어서 기능 구현에는 큰 어려움이 없었다. 

문제가 생겨도 디버깅이 익숙해 큰 문제가 되지도 않았다. 

하지만 담당 분배라든가 일정 관리 그리고 결단력에서 리더십이 좀 부족하다는 생각을 많이 했다. 

그리고 퍼블 작업을 할 때 내가 보기에는 이상하다고 느끼지 못했는데, 팀원이 CSS를 좀 손보더니 너무 고급스럽게 바뀐 것이다. 

CSS 작업은 항상 시간이 많이 드는데, 속도도 올릴 겸 CSS 작업할 때 참고할 만한 CSS 코드를 모아두는 레포를 하나 만들어야겠다는 생각이 들었다.


# 4. 자료
- [깃허브 링크](https://github.com/whitewise95/tomorrow-learning-camp/tree/main/8%EC%A3%BC%EC%B0%A8-React_%ED%8C%80%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8)

- 스택
![](https://velog.velcdn.com/images/whitewise95/post/26d7f82f-66a1-4d30-92e6-a614cbfce468/image.png)

- [시연연상 유튜브 이동](https://www.youtube.com/watch?v=I7RdscmxT5E)
