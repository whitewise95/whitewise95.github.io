---
layout: post
title: '[내배캠:리액트과정] 중고 도서를 거래할 수 있는 플랫폼 "북새통" 개발기'
date: 2024-08-05 00:00:00 +0900
categories: [리액트 부트캠프]
tags: [리액트, 내일배움캠프, 프로젝트, 회고]
permalink: /react-bootcamp/react-bootcamp-05/
---

> 원문: https://velog.io/@whitewise95/내배캠리액트과정-중고-도서를-거래할-수-있는-플랫폼-북새통-개발기

## 글 소개

이번에는 Typescript, Next.js를 사용해 웹개발을 하는 프로젝트이다.리액트는 내배캠을 하기 전 선행학습으로, JS,html,css는 기초적인 문법은 이미 알고 있어서 잘 헤쳐나아갈 수 있었지만 TS와 Next.js는 처음 접하는 언어와 프레임워크라 프로젝트

## 본문

![](https://velog.velcdn.com/images/whitewise95/post/2cb1dfdb-cd3a-4c7f-b19e-7d160df13c05/image.png)

---

### [ gitHub 바로가기](https://github.com/whitewise95/Booksaetong)


이번에는 Typescript, Next.js를 사용해 웹개발을 하는 프로젝트이다.

리액트는 내배캠을 하기 전 선행학습으로, JS,html,css는 기초적인 문법은 이미 알고 있어서 잘 헤쳐나아갈 수 있었지만 TS와 Next.js는 처음 접하는 언어와 프레임워크라 프로젝트가 끝날 때 쯤 익숙해진 것 같다.

이전 프로젝트에서는 내가 많이 알려줬지만 이번 프로젝트는 팀원들의 도움을 많이 받았다.


번외로... TS를 쓰기 전 나는 행복한 아이라고 생각한다... 🥲
자바를 사용했기 때문에 타입을 선언해준다라는 부담감이 없었지만 이게뭐람?
정말 극단으로 비유하자면 low-level 까지 타입을 지정해줘야 BuildError가 나지 않는다 <= 이게 정말 죽을 맛...



> ts를 배우고 이전 프리로 잠시 일했을 때 만났던 개발자들 단톡방에 징징거리고 있는 나.....
![ts를 쓰는데 리액트개발자가 있는 단톡방에 징징거리고 있는 나.....](https://velog.velcdn.com/images/whitewise95/post/204e0c85-b07d-4de7-b276-50ff513a9896/image.png)




---
# 📕 개발기 

우리팀은 이커머스같은 느낌으로 하고 싶지만 PG사로 결제를 시스템을 개발하고 주문시스템을 5일안에 높은 퀄리티로 완성할 수 없을 거라는 생각에 결제시스템이 없어도 되는 거래 플랫폼에 대해 만들어 보자는 의견이 통일되어서 `중고 책 거래 플래폼`으로 정해졌다.



![](https://velog.velcdn.com/images/whitewise95/post/e431cf8e-5cf8-441b-9898-4cd564f15716/image.png)


총 6명으로 지금까지 프로젝트를 하면서 최대인원으로 개발을 시작해서 너무 좋았다 😄 
아마 프로젝트를 진행하면 러프하게 진행할 수 있었던 프로젝트로 처음이자 마지막이지 않을까 생각이든다.


---

## 🔥 중고 도서를 거래할 수 있는 플랫폼 "북새통" 


### 메인페이지 
전체 도서목록과 자신의 근처에 판매하고 있는 도서목록을 간단하게 볼수 있는 페이지다.
![](https://velog.velcdn.com/images/whitewise95/post/44d53202-b2fa-4cad-8253-c99412cb7aaa/image.png)


### 전체도서목록 
내가 맡게 된 전체도서목록은 각 장르별로 필터링을 할 수 있고 상단에 검색으로 자유롭게 검색해 책을 빠르게 찾을 수 있는 페이지다. 

![](https://velog.velcdn.com/images/whitewise95/post/c67b33c4-ab36-4b9d-8e43-216627a10f03/image.png)



무한 스크롤과 SQL를 사용해서 최대한 한번의 조회로 최대의 효율을 낼 수 있도록 개발했다. 

도서 전체목록을 조회하기위해 `useInfiniteQuery` 를 사용해 현재 page와 페이징당 글 개수 limit으로 페이징처리를 하고 keyword와 필터링할 category 목록을 받아 where문을 걸어 조회를 했다.
```ts
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery<
    pageProductListType,
    Error,
    InfiniteData<pageProductListType>,
    [string, { keyword: string; requestCategoryList: string[]; requestLimit: number }],
    number
  >({
    initialPageParam: 0,
    queryKey: [
      'productListOfAll',
      {
        keyword: `%${keyword}%`,
        requestCategoryList: categoryList.length === 0 ? defaultOptions : categoryList,
        requestLimit: 12
      }
    ],
    queryFn: getAllProductList,
    getNextPageParam: (lastPage, allPages): number | undefined => lastPage.nextPage
  });
```


아래코드는 위 `useInfiniteQuery`로 조회하는 API Route.ts 파일인데, supabase의 정의해둔 SQL를 사용해 상대적으로 한번의 통신만으로 조회가 끝나 성능적으로 유리하게 가져갈 수 있었다.
```ts
export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') as string;
    const categoryList = JSON.parse(searchParams.get('categoryList') as string) as string[];
    const requestLimit = parseInt(searchParams.get('requestLimit') as string, 10) as number;
    const requestOffset = parseInt(searchParams.get('requestOffset') as string, 10) as number;

    type GetFilteredProductListArgs = Database['public']['Functions']['get_filtered_product_list']['Args'];

    const args: GetFilteredProductListArgs = {
      keyword,
      category_list: categoryList,
      request_limit: requestLimit,
      request_offset: requestOffset
    };

    const { data, error } = await supabase.rpc('get_filtered_product_list', args);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json([]);
  }
};
```




슈파베이스의 SQL편집기 기능으로 PL/pgSQL 문법을 기반으로 작성한 쿼리이다.
오라클이나 MySql, MSSQL 등 써봤지만 PL/pgSQL 문법이나 JSON, XML, 배열, 범위 타입 등의 고급 데이터 타입을 사용해보지는 않았는데, PostgreSQL를 사용하면서 사용해봐서 좋은 경험을 한 것 같다.

이번 PostgreSQL를 처음 사용하는 입장에선 좀 더 통신을 적게하기위해 JSON, XML, 배열, 범위 타입 등 다양한 고급 데이터 타입으로 최대한 한번에 조회하려고 사용도 해보고 이를 통해 비정형 데이터나 복잡한 데이터를 처리하는 데 유용하게 사용할 수 있었던 것 같다.

백엔드로 사이드프로젝트나 토이프로젝트가 있다면 PostgreSQL를 한번 경험해보는 것도 좋을 것 같다는 생각을 했다🙃

```sql
DROP FUNCTION IF EXISTS get_filtered_product_list_of_around(request_address text, keyword text, request_limit integer, request_offset integer);

CREATE OR REPLACE FUNCTION get_filtered_product_list_of_around(request_address text, keyword text, request_limit integer, request_offset integer)
RETURNS TABLE(
  id uuid,
  title text,
  address text,
  price integer,
  like_count bigint,
  image_url text,
  user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT P.id,
         P.title,
         P.address,
         P.price,
         (SELECT COUNT(PL.id) FROM product_likes PL WHERE PL.product_id = P.id) AS like_count,
         (SELECT PI.image_url FROM product_images PI WHERE PI.product_id = P.id ORDER BY PI.id asc LIMIT 1) AS image_url,
         P.user_id
  FROM products P
 WHERE  (P.title ILIKE keyword or P.address ILIKE keyword) and P.address ILIKE request_address
  ORDER BY P.created_at DESC, P.id DESC
  LIMIT request_limit OFFSET request_offset;
END;
$$ LANGUAGE plpgsql;
```


## 🔥 무한 스크롤 

전체 도서목록에 무한 스크롤을 적용시키기 위해 `addEventListener` 를 사용해 구현했는데, 이번 피드백에서 이런 방법은 트렌디하지 않고 한번의 스크롤로 많은 조회가 일어나 성능저하가 일어날 수 있기에 피해야 한다고 했다. 

```ts
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
```

그래서 알려주신 방법이 있었는데,


[react-intersection-observer 라이브러리
](https://www.npmjs.com/package/react-intersection-observer)   React 애플리케이션에서 Intersection Observer API를 간편하게 사용할 수 있도록 도와주는 라이브러리로, Intersection Observer API는 특정 요소가 뷰포트 내에 들어왔는지 또는 나갔는지를 비동기적으로 관찰할 수 있는 브라우저 API라고 한다. 

이를 통해 사용자가 페이지를 스크롤할 때 특정 요소가 화면에 나타나는지 여부를 감지할 수 있는데 사용기 너무 쉬워서 너무 좋았던 거 같다.

사용법은 정말 간단하다. 
라이브러리에서 제공하는 useInView 훅으로 ref를 만들고 데이터 목록중에 마지막 요소에 심어주면 된다. 

```ts
  const { ref } = useInView({
    threshold: 0,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
  })
  
     ... 생략
  ----
  
  {data?.map((comment, idx) => {
    const isLastItem = data?.length - 1 === idx //마지막 인덱스인지 체크
    return (
    <div
    className={
    "mt-2 flex w-full gap-[8px] rounded-lg border p-4 shadow-md"
    }
    key={comment.id}
    ref={isLastItem ? ref : null} // 심어주기
    >

      ... 생략
```

## 🔥 Next.js

Next.js는 React 기반의 프레임워크로, csr을 하는 리액트에서 서버 사이드 렌더링(SSR)과 정적 사이트 생성(SSG)을 지원하는 것이 특징인데, 

그래도 내가 정말 신기하고 놀랐던 기술은 3가지 정도가 있다.

1. app router
2. Middleware
3. Route Handlers



### app router

Next.js 13 이전에는  `Pages Router` 였지만 Next.js 13 이후로는 app 디렉토리 내에 폴더와 파일 구조를 통해 라우트를 정의하는 기술이 도입되었다 이게 대박인게 뭐냐면 `app/dashboard/page.js` 이렇게 파일을 생성하면 `/dashboard` 경로와 매핑이 된다는 것이다.

![](https://velog.velcdn.com/images/whitewise95/post/75eb2ade-b0fd-4798-be89-c2e97cefac3d/image.webp)


### Middleware
요청이 서버에 도달하기 전에 실행되는 코드를 작성할 수 있는 강력한 기능으로  요청의 흐름을 제어하고, 인증, 리다이렉션, 쿠키 설정 등 다양한 작업을 수행하는 데 사용되는 기능인데, 각 요청마다 인증과 인가가 필요한 부분에서 많이 사용했다. 


### Route Handlers
`Route Handlers`는 API 라우트를 대체하거나 보완하는 기능으로, 서버 측에서 HTTP 요청을 직접 처리할 수 있게 해준다. 이를 통해 각 요청에 대해 다양한 HTTP 메서드(GET, POST, PUT, DELETE 등)를 처리하는 코드를 작성할 수 있으며, 이 과정에서 더 세밀한 제어를 할 수 있다. 

하지만 아직은 복잡한 시스템을 전부 처리하기에는 부족하지 않나라는 생각을 조심스럽게 한다. 

성능이슈는 둘째 치고 유지보수면이나 코드 가독성이 매우 안좋아진다는 생각을 했다.


# 📕 왜 다들 잘하지?
![](https://velog.velcdn.com/images/whitewise95/post/732604d8-7b2f-4cc5-8208-63709d31b44d/image.webp)

지난 팀프로젝트와는 비교도 안되게 다들 너무 잘해주고 기능이 많았지만 팀원이 6명이라 나눠가지니 시간적으로 여유가 있었던 프로젝트였다.

덕분에 성능적으로도 또는 개발된 기능을 좀 더 디벨롭할 수 있었던 시간이 확보가 되어 스스로 많은 발전을 한 프로젝트로하고 생각이 든다. 

나중에 시간이 더 된다면 직접 쿼리를 작성해서 여러 테이블을 조인해 가져올 수 있었지만 여러번 조회를 하도록 변경해보고 성능을 한번 체크해보고 싶다. 
