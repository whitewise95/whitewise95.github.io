---
layout: post
title: "[내배캠:리액트과정] TanstackQuery와 zustand를 사용한  개인 지출 관리 웹 고도화 과정 "
date: 2024-06-16 00:00:00 +0900
categories: [리액트 부트캠프]
tags: [리액트, 내일배움캠프, 프로젝트, 회고]
permalink: /react-bootcamp/react-bootcamp-03/
---

> 원문: https://velog.io/@whitewise95/내배캠리액트과정-TanstackQuery와-zustand를-사용한-개인-지출-관리-웹-고도화-과정

## 글 소개

이전에 개인 지출 관리 웹 개발기에 대해 글을 작성한 적이 있다. 이전 글에서는 개인 지출 관리 웹 애플리케이션을 처음 개발하며 겪었던 경험과 배운 점들 대해 설명했다. 특히, props drilling, Context API, Redux를 순차적으로 도입하며 리팩토링

## 본문

![](https://velog.velcdn.com/images/whitewise95/post/39c7d191-e4fe-4df8-9a0f-f4d08289e962/image.jpeg)

---

# 1. 시작

이전에 [개인 지출 관리 웹 개발기](https://velog.io/@whitewise95/%EB%82%B4%EB%B0%B0%EC%BA%A0-%EB%A6%AC%EC%95%A1%ED%8A%B8%EA%B3%BC%EC%A0%95-%EA%B0%9C%EC%9D%B8-%EC%A7%80%EC%B6%9C-%EA%B4%80%EB%A6%AC-%EC%9B%B9-%EA%B0%9C%EB%B0%9C-%ED%9B%84%EA%B8%B0-props-Drilling-Context-API-Redux-%EC%88%9C%EC%9C%BC%EB%A1%9C-%EB%A6%AC%ED%8C%A9%ED%86%A0%EB%A7%81)에 대해 글을 작성한 적이 있다. 

이전 글에서는 개인 지출 관리 웹 애플리케이션을 처음 개발하며 겪었던 경험과 배운 점들 대해 설명했다. 

특히, props drilling, Context API, Redux를 순차적으로 도입하며 리팩토링하는 과정을 상세히 다루었다. 이를 통해 상태 관리의 중요성과 다양한 도구들의 장단점을 직접 체험할 수 있었다.

이번 9주차의 목표는 바로 이 고도화 작업을 통해 애플리케이션의 성능을 향상시키고, 코드베이스를 더욱 견고하게 만드는 것이다.


# 2. 고도화 작업의 주요 요구사항 및 목표

## 📕 요구사항

✅ 지출 관리 시스템에 회원가입 / 로그인 기능 구현 (jwt 인증서버를 사용)

✅ json-server 를 이용해 지출 데이터에 대한 CRUD 를 구현

✅ API 호출 시, fetch 대신 axios 를 필수적으로 사용

✅ 페이지에서 (jsx) 파일에서 API 응답 값을 바로 사용하지 말고, Tanstack Query 이용



## 📕 목표

## ▶︎ Tanstack Query 도입

서버 상태 관리의 효율성을 극대화하기 위해 Tanstack Query를 도입할 예정이다. 이를 통해 데이터 페칭, 캐싱, 동기화 그리고 백그라운드 업데이트를 보다 간편하게 관리할 수 있다.

Tanstack Query는 특히 비동기 데이터 관리에 강점을 가지고 있어, 기존의 Redux 기반 상태 관리보다 더 나은 성능과 사용자 경험을 제공할 것으로 기대된다.


## ▶︎ Zustand를 이용한 로컬 상태 관리

전역 상태 관리의 복잡성을 줄이기 위해 Zustand를 도입할 했다. Zustand는 간단하고 직관적인 API를 제공하여 로컬 상태 관리를 더욱 쉽게 만들어 준다.

리덕스 툴킷과 어떻게 다른지, 애플리케이션의 구조를 단순화하고, 상태 관리 코드의 양을 줄여 유지보수성을 높일 수 있는 경험을 기대한다.


# 3. 고도화 과정 

## 📕 Tanstack Query....
이번 주차의 강의가 지급되었고 그 중에 tanstack query에 대한 내용도 포함되어 있었다.

![](https://velog.velcdn.com/images/whitewise95/post/5afa1758-675d-4986-9548-76d9e98626de/image.png)

6개의 강의로 구성되어 있었고 강의 내용이 길지 않은 편이라 우선 가볍게 듣자라는 마음으로 강의를 전부들었다.

![](https://velog.velcdn.com/images/whitewise95/post/d9c5a356-8f7e-4679-b3bf-b17a2152e626/image.png)


useQuery, useMutation, invalidateQueries에 대해서는 이해가 되었다.

이후 동작 원리와 Query Cancellation, Optimistic Updates 내용까지 배우게 되었는데, 설정해야 하는 옵션들이 너무 많고 캐시부터 시작해 stale-while-revalidate(swr) 전략까지 다루다 보니, 이 내용들이 가볍게 들을 수 없을 정도로 무겁게 느껴졌다.

특히, swr 전략은 데이터가 얼마나 최신 상태인지에 대한 관리 방법을 다루는 중요한 개념이다. 이 전략은 오래된 데이터를 즉시 제공하고, 백그라운드에서 최신 데이터를 가져와 갱신하는 방식으로 사용자 경험을 향상시키는 데 중점을 둔다. 이로 인해 애플리케이션의 응답성을 높이며, 사용자에게 더 나은 경험을 제공할 수 있다.

또한, Query Cancellation과 Optimistic Updates는 비동기 작업에서의 사용자 경험을 크게 향상시키는 중요한 기술이다. Query Cancellation은 불필요한 네트워크 요청을 줄여 성능을 최적화하고, Optimistic Updates는 데이터 변경 시 사용자 인터페이스가 즉시 반응하도록 하여 더 자연스럽고 빠른 사용자 경험을 제공한다.

그리고 처음 이해가 잘 되었던 useQuery, useMutation, invalidateQueries에 대해서도 초기화가 되버릴 정도로 충격이었다. 이는 새로운 개념을 배우면서 기존 지식이 혼란스러워지는 과정에서 자연스러운 현상이다. 하지만 이는 결국 더 깊은 이해를 위한 필수적인 단계라고 생각한다.

이제는 TanStack Query의 다양한 기능들을 활용해, 실전 프로젝트에서 더욱 효율적이고 사용자 친화적인 애플리케이션을 개발할 수 있을 것이다. 이를 위해서는 지속적인 학습과 실습이 필요하며, 각 기능의 동작 원리와 최적화 방법을 깊이 파악하는 것이 중요하다.


### ▶︎ useQuery 
useQuery는 보통 조회를 할 때 사용한다고 하는데 isPending, isError 객체를 통해 현재 상태가 어떤지 확인 할 수 있는 것 자체가 너무 간편해서 좋았다. 

```jsx
  const {
    data: expenditureList,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['expenditureList'],
    queryFn: getExpenditureList,
  });
```

스피너 라이브러리를 사용해  isPending시 스피너 UI를 보여줄 수 있도록 개선할 수 있었다.

![](https://velog.velcdn.com/images/whitewise95/post/567c7264-89fe-4119-b4e4-e0f49da68a34/image.png)



반면에 트러블 슈팅도 겪었다.

아래 코드는 로그인 이후 나의 정보를 조회하는 useQuery이다. 조회가 되면 전역으로 상태관리할 수 있도록 useEffect으로 로직을 작성한 로직이였다.

```jsx
  const {
    data: account,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['account'],
    queryFn: getMyInfo,
  });

  useEffect(() => {
    setAccount(account);
  }, [account.id, account.nickname, account.avatar]);
```

로그인 후 아래와 같은 에러가 발생했다.
![](https://velog.velcdn.com/images/whitewise95/post/b89601da-69fa-4653-bb81-a85ce2e2607c/image.png)


디버깅을 해보니 Tanstack Query는 비동기에 특화된 라이브러리다 보니 비동기로 작동하기에 첫렌더링시 아직 pending 중이라서 useEffect의 의존성배열에 있는 account.id를 접근할 수 없었던 것이다.

사실은 Tanstack Query가 비동기로 작동한다는 걸 까먹고 1시간 정도 전역상태관리가 잘못된 줄 알고 계속 이상한 곳을 파고 있었지만....  optional chaining으로 해결할 수 있었다.

### ▶︎ 트러블 슈팅

![](https://velog.velcdn.com/images/whitewise95/post/35b13bc8-56b2-4682-b702-a2ac2314621c/image.png)


### ▶︎ 트러블 슈팅 해결
```jsx
  useEffect(() => {
    setAccount(account);
  }, [account?.id, account?.nickname, account?.avatar]);

```



## 📕 fetch => Axios

이번 과제의 요구사항 중 하나인 fetch 대신 Axios를 사용하는 것이다. 

나는 `axios.create`와 `interceptors` 등 axios의 기본 설정을 하는 js와 실제로 통신로직이 있는 js파일을 분리하고 도메인별로 관리하고 싶었다. 

![](https://velog.velcdn.com/images/whitewise95/post/6311acf0-80b2-41c5-9e23-fad5c30772a8/image.png)

> ⭐ api.js에는 interceptors와 baseUrl등 default 설정을 하고 생성된 axios를 관리하는 파일이고 

```js
import axios from 'axios'; 

const jwtCertificationServerApi = axios.create({
  baseURL: 'https://moneyfulpublicpolicy.co.kr',
  timeout: 1000,
  headers: { 'X-Custom-Header': 'foobar' },
});

jwtCertificationServerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

jwtCertificationServerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 토큰이 만료된 경우 로그아웃 처리 또는 토큰 갱신 로직을 추가할 수 있습니다.
      localStorage.removeItem('accessToken');
      window.location.href = '/login'; // 로그인 페이지로 리디렉션
    }
    return Promise.reject(error);
  },
);

export default jwtCertificationServerApi;
```

> ⭐ 각 도메인명으로 된 js파일들은 실제로 통신로직이 들어가 있는 파일이다.

```js
import jwtCertificationServerApi from './api.js';

export const register = async (newAccount) => {
  await jwtCertificationServerApi.post('/register', newAccount);
};

export const login = async (account) => {
  const response = await jwtCertificationServerApi.post('/login', account);
  return response.data;
};

export const getMyInfo = async () => {
  const response = await jwtCertificationServerApi.get('/user');
  return response.data;
};

export const updateNickname = async (newNickname) => {
  const response = await jwtCertificationServerApi.patch('/profile', { nickname: newNickname });
  return response.data;
};

```


## 📕 json-server

기존에는 localStorage에 데이터를 set하고 get하는 방식으로 데이터를 보관했지만, 이번에는 json-server를 사용해 JSON 파일로 데이터를 관리하고, Restful한 API를 사용하면서 Restful에 대해 더 깊게 이해할 수 있는 시간을 가지게 하는 것이 목표였다.

json-server를 사용하면 간단한 설정만으로 로컬 환경에서 실제 서버와 유사한 API를 구축할 수 있다. 이를 통해 클라이언트 애플리케이션은 실제 서버와 상호작용하는 것처럼 개발하고 테스트할 수 있다. 또한, Restful API는 리소스를 URI로 식별하고, HTTP 메서드(GET, POST, PUT, DELETE, PATCH 등)를 통해 리소스를 조작하는 방식으로, 웹 애플리케이션 개발에서 중요한 개념이다.


### ▶︎ 기존 useEffect로 로컬스토리지에 지출 내역 데이터를 적재하는 로직 
```jsx
  useEffect(() => {
    localStorage.setItem('expenditureList', JSON.stringify(expenditureList));
  }, [expenditureList]);

```

### ▶︎ json-server를 사용한 데이터 적재 로직
```js
export const getExpenditureList = async () => {
  const response = await jsonServerApi.get('/expenditures');
  return response.data;
};

export const getExpenditure = async (expenditureId) => {
  const response = await jsonServerApi.get(`/expenditures/${expenditureId}`);
  return response.data;
};

export const createExpenditure = async (newExpenditure) => {
  await jsonServerApi.post(`/expenditures`, newExpenditure);
};

export const updateExpenditure = async ({ expenditureId, updatedExpenditure, }) => {
  await jsonServerApi.patch(`/expenditures/${expenditureId}`, updatedExpenditure);
};

export const deleteExpenditure = async (expenditureId) => {
  await jsonServerApi.delete(`/expenditures/${expenditureId}`);
};
```

## 📕 배포 

리액트 소스는 버셀로 배포하고 json-server는 glitch로 배포했다.

버셀은 정말... AWS나 GCS등 비교하면 매우 간편하게 배포가 되는 것 같다.
버셀은 리액트과정으로 여러번 배포할 기회가 있어서 문제 없이 배포했던거 같다. 
단지 리액트와 버셀의 궁합? 이 맞지 않아서 404에러가 나는 경우가 있는데 

vercel.json 이라는 파일명으로 root 경로에 아래 내용으로 추가하면 해결이 된다고 한다.
```json
{
  "rewrites":  [
    {"source": "/(.*)", "destination": "/"}
  ]
}
```



# 4. 마무리 및 배운 점
이번 9주차의 고도화 작업을 통해 많은 것을 배우고 경험했다. 특히, 다양한 최신 기술을 도입하고 실제 프로젝트에 적용하면서 여러 가지 문제를 해결하는 과정을 통해 많은 성장을 이룰 수 있었다.


## Tanstack Query를 도입하면서
비동기 데이터 관리를 보다 효율적으로 할 수 있었다. 특히, 데이터 페칭, 캐싱, 동기화, 백그라운드 업데이트 등의 기능을 통해 사용자 경험을 크게 향상시킬 수 있었다. 비동기 작업에서의 사용자 경험을 최적화하기 위한 Query Cancellation과 Optimistic Updates 같은 기술을 배우면서, 더 나은 성능을 제공하는 애플리케이션을 개발하는 데 많은 도움이 되었다.


## Zustand를 이용한 로컬 상태 관리
는 전역 상태 관리의 복잡성을 줄이는 데 매우 효과적이었다. Zustand의 간단하고 직관적인 API 덕분에 상태 관리 코드의 양을 줄이고 유지보수를 쉽게 할 수 있었다. 이를 통해 애플리케이션의 구조를 단순화하고, 보다 견고한 코드를 작성할 수 있었다.


## Axios를 사용하여 
API 호출을 관리하고 json-server를 통해 로컬 환경에서 실제 서버와 유사한 API를 구축하는 과정을 통해 Restful API에 대한 이해를 높일 수 있었다. 또한, Axios의 interceptors와 같은 기능을 활용하여 공통적인 설정을 관리하는 방법을 배우면서, 코드의 재사용성과 유지보수성을 향상시키는 데 많은 도움이 되었다.


## 리액트 소스는 Vercel을 통해
json-server는 Glitch를 통해 배포하면서 배포 과정에 대한 이해를 높일 수 있었다. 특히, Vercel을 사용하여 간편하게 배포할 수 있었던 경험은 매우 유익했다.

## 이번 프로젝트를 통해 
다양한 최신 기술을 직접 적용하고 문제를 해결하는 과정을 통해 많은 것을 배웠다. 이러한 경험은 앞으로의 프로젝트에서도 큰 도움이 될 것이다. 지속적인 학습과 실습을 통해 더욱 발전하는 개발자가 되도록 노력하겠다.
