---
layout: post
title: "[내배캠: 리액트과정] 개인 지출 관리 웹 개발기 (props Drilling → Context API → Redux) 순으로 리팩토링"
date: 2024-05-27 00:00:00 +0900
categories: [리액트 부트캠프]
tags: [리액트, 내일배움캠프, 프로젝트, 회고]
permalink: /react-bootcamp/react-bootcamp-01/
---

> 원문: https://velog.io/@whitewise95/내배캠-리액트과정-개인-지출-관리-웹-개발-후기-props-Drilling-Context-API-Redux-순으로-리팩토링

## 글 소개

24년 5월 20일 ~ 5월 29일까지 개인 지출 관리 웹 개발을 하는 과제가 발제되었다.과제 내용은 처음에는 props로 개발하고 Context API로 리팩토링 후에 마지막으로는 Redux로 리팩토링하는 과정으로 진행된다. 내배캠을 하기전 한번씩 리액트 강의 본 적

## 본문

![](https://velog.velcdn.com/images/whitewise95/post/71c77bdc-7f1e-4165-beb5-1f0ec643ef5b/image.jpeg)



# 1. 들어가기 전
---

24년 5월 20일 ~ 5월 29일까지 개인 지출 관리 웹 개발을 하는 과제가 발제되었다.

![](https://velog.velcdn.com/images/whitewise95/post/e81e54cb-cdd1-4c26-93ed-357af0140a3d/image.png)


과제 내용은 처음에는 props로 개발하고 Context API로 리팩토링 후에 마지막으로는 Redux로 리팩토링하는 과정으로 진행된다. 

내배캠을 하기전 한번씩 리액트 강의 본 적이 있는데 강의를 따라 하면서 props Drilling → Context API → Redux -> Redux-tool-kit - next.js 순으로 각각 같은 주제로 앱개발을 해보고 싶었지만 그 때 당시 일을 동시에 하고 있어서 시간적으로 힘들었다. 

그래서 더욱 더 내배캠에서 좋은 과정으로 과제가 진행된다고 생각이 든다. 

이 글의 내용은 내배캠 과정중 개인 지출 관리 웹 개발 후기 (props Drilling → Context API → Redux) 순으로 리팩토링하는 과정에 있었던 내용을 정리 했다.


# 2. 과정
---

## 과제 시작 전
과제 웹의 완성형은 날짜, 항목, 금액, 내용을 적고 저장을 누르면 해당 월의 지출 내역에 저장이되고, 해당내용을 클릭하면 상세로 이동해 수정, 삭제를 할 수 있는 간단한 CRUD 기능들만 있는 웹이다.

아래는 이미 구현된 웹사이트를 제공해주는 웹의 캡쳐본이다.

![](https://velog.velcdn.com/images/whitewise95/post/ae2087b2-9cdf-4e3b-925b-becedc4ed962/image.png)



![](https://velog.velcdn.com/images/whitewise95/post/01013fb0-3d67-4e75-b50b-1f5bd0c8cd51/image.png)

나는 시작하기 전에 이 과제를 끝내면 `props`와 `useContext`, `Reudx`의 각 장단점들과 `useContext`와 `Redux`그리고 클론코딩에 대한 자신감을 얻을 것으로 기대하고 있었다. 

더불어 메모이제이션을 통해 렌더링 최적화도 해볼 예정이였다.


## 렌더링 최적화
`Porps`로만 개발 중 개발이 완료되었고 렌더링 최적화를 해보고 싶었다.

렌더링 최적화를 하기 전에 쓸 때 없는 리렌더링이 일어난 곳을 알고싶었다.
그래서 이벤트가 발생 시 리렌더링이 일어나면 안되어야 한다고 생각하는 부분들을 정리 했다.

### 컴포넌트 소개
빨간 색으로 표시된 부분들은 전부 하나의 부모컴포넌트의 자식 컴포넌트이다.
![](https://velog.velcdn.com/images/whitewise95/post/5840edba-4bdc-45dd-993c-702460dca15e/image.png)


### 리렌더링이 일어나면 안되는 부분 정리
빨간색으로 표시한 곳은 지출 내역을 추가하는 기능을 맡은 컴포넌트이다. 
해당 컴포넌트에서 create 돼서 리렌더링이 일어나면 파란부분으로 칠해진 부분은 리렌더링이 되면 안된다.
반대로 파란색 부분이 리렌더링되면 빨간 부분이 리렌더링되면 안된다.
![](https://velog.velcdn.com/images/whitewise95/post/c37c6d50-b612-4b91-b1bf-157b99191428/image.png)




### 리렌더링이 일어나는 걸 어떻게 확인하지?
이제 리렌더링이 어떻게 되는지 알아볼 차례다. 근데 어떻게 하지?
![](https://velog.velcdn.com/images/whitewise95/post/2e13ff1a-a669-408a-b3e7-4759b963f98e/image.png)

그래도 하나쯤은 있지 않을까? 해서 구글에 `리렌더링 최적화` 를 바로 검색했다. 
그러더니 리액트 dev tools 가 있어서 설치했다.
![](https://velog.velcdn.com/images/whitewise95/post/8ec788b7-e2fa-407a-b434-8b7309704a79/image.png)


### 최적화 과정

역시나 지출내역 생성 컴포넌트(이하 빨간 부분)가 작동하면 월 선택 컴포넌트(파란 부분)리렌더링된다.

![](https://velog.velcdn.com/images/whitewise95/post/dcd5d845-749e-4ad9-87c0-9bc76bd4475d/image.png)


`memo` 로 `props`의 참조값이 변경되지 않는 한 리렌더링이 생성되지 않도록 했고 `props`로 함수를 넘겨주고 있는데 해당 함수의 참조값이 변경되지 않도록 `useCallback` 을 감싸주었다.
```jsx
export default React.memo(SelectMonth);
```

```jsx
  const changeCurrentMonth = useCallback((selectedMonth) => {
    setCurrentMonth(selectedMonth);
  },[currentMonth]);
``` 

코드를 추가하고 다시 체크해보니 리렌더링이 안 일어나는 것을 확인할 수 있었다.
이렇게 불필요한 리렌더링을 체크하고 리팩토링하는 과정을 하니깐 재미있었다. 

![](https://velog.velcdn.com/images/whitewise95/post/75698b84-049b-4c0e-b0fb-c5ddc073225c/image.png)

빨간부분도 파란부분에서 기능이 작동해 부모 컴포넌트가 리렌더링되더라도 빨간부분이 리렌더링 되지 않도록 최적화를 완료했다.

![](https://velog.velcdn.com/images/whitewise95/post/f7960cf0-1a0c-4c90-b00d-7f007756d332/image.png)



## Props => Context API 진행 과정


컴포넌트는 아래 도식화처럼 되어 있다.
![](https://velog.velcdn.com/images/whitewise95/post/ae776c55-c4b7-4973-90a2-1ad695b8b8ae/image.png)


`App`에서 `Home`에서 사용하지 않고 Home의 자식 컴포넌트에 전달되는 `props`을 넘겨줘야해서 `props Drilling`이 존재했다.



### props 사용시
> props 사용시  Home에서 사용하지 않는 Data도 받아야했다.
![](https://velog.velcdn.com/images/whitewise95/post/a7ea2fe3-5f84-4a06-8616-2a2f19d2b5a3/image.png)
  
### context 이후
> Home에서만 사용하는 Data만 받을 수 있게 되었다.
![](https://velog.velcdn.com/images/whitewise95/post/2c650fc8-d173-41ff-8634-e466545dfc2b/image.png)




## Context API => Redux 진행 과정
개인 지출 관리 웹이 엄청 작은 웹이다보니 contextAPI에서 Redux로 리팩토링하는 과정에서 많이 알려진 Redux의 장점을 느끼지는 못했다.


그나마 내가 느낀 부분을 적어보려고 한다.

### ✅ 첫번째
우선 `Context`를 사용하면 provider에 value를 주어야 하기 때문에 여러 곳에서 사용한다면 `무조건 중복된 코드가 존재`할 수 밖에 없다고 느겼다.

아래 이미지를 보면 Routes 상위에 Context 공급자에게 Value를 주고 있다. 지금 개발중인 프로젝트가 만약 엄청 큰 프로젝트였다면  Context를 Routes 상위에 두는 건 보기 안좋다고 생각이 들었기 때문에 각 Route에 두거나 각 페이지컴포넌트 안에 Context를 두어야한다고 판단했다. 때문에 중복으로 들어가는 코드가 많았을 것이라고 생각이 든다.
![](https://velog.velcdn.com/images/whitewise95/post/467dea97-d33d-436d-933f-e6b0d1f0a05d/image.png)


하지만 `리덕스`로 리팩토링하게 되면서 `index.jsx에 Provider 컴포넌트에 store만 제공해주면 끝`나기 때문에 큰 장점으로 다가왔다.
```jsx
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(

	//App을 Provider로 감싸주고, configStore에서 export default 한 store를 넣어줍니다.
  <Provider store={store}> 
    <App />
  </Provider>
);
```

### ✅ 두번째
useState와 Context 사용하지 않아도 전역으로 초기 값을 세팅할 수 있고 현재 값을 읽을 수 있으며, 값 업데이트가 가능하다는 점에서 상태관리라는 장점이 있었다.



### ✅ 세번째
나는 개발자로서 초반의 견고한 설계와 탄탄한 기초 작업이 건축의 기초와 같다고 믿는다.

하부 구조가 부실하면 아무리 화려한 빌딩도 무너지기 마련인데, 그래서 저는 처음부터 철저하게 설계하고, 기초를 튼튼히 다지는 데 주력한다.

하지만 props나 context를 사용하면서 뭔가  철저하게 설계되고 기초가 튼튼하다는 느낌을 받지 못했지만 
Redux를 사용하면서 기초가 튼튼해지고 차곡차곡 쌓아 건축되는 느낌을 받아 너무 재미있게 리팩토링한 것 같다.




# 3. 개발은 역시 직접....
항상 느끼고 있지만 일 끝나고 너무 피곤하면 강의만 보거나 책만 보고 끝나는 경우가 다반사였다. 
![](https://velog.velcdn.com/images/whitewise95/post/4e7a4638-708f-4759-85c5-e811046f069c/image.png)

하지만 이번 계기로 역시 개발자의 공부법은 직접 쳐보는 것이 답이구나 라고 느꼈다...




# 4.궁금했던 부분

##  💡 import 되는 시점
이 많은 import들이 한번에 로드가 되는지, 아니면 해당 컴포넌트에 접근했을 때만 로드가 되는지 궁금했다.

알아보니...

웹팩(Webpack)과 같은 모듈 번들러는 애플리케이션을 빌드할 때 모든 import 문을 찾아서 번들에 포함시키는데, 이 과정에서 코드가 번들로 묶이고, 번들 파일이 브라우저에 로드된다고 한다.

즉, 유저가 웹 애플리케이션에 접속하면 브라우저는 서버에서 번들 파일을 다운로드하고 다운로드된 번들 파일은 브라우저에서 실행된다.

이 시점에서 import된 모든 모듈이 한꺼번에 로드하여 실행된다고한다.
![](https://velog.velcdn.com/images/whitewise95/post/22c165e5-e1aa-4b54-977a-15cf8d8e75f4/image.png)
> 결국은... import들도 성능저하의 가능성이 열려있다.  
대표적으로 아래와 같은 방법으로 해결이 가능하다.



 ✅ **React.lazy와 Suspense** - 리액트 내장 기능, 간편하고 기본적인 코드 스플리팅에 적합.
 
 ✅  **React Loadable 사용** - 더 많은 옵션과 유연성을 제공하지만, 현재는 잘 사용되지 않음.
 
 ✅ **Webpack Dynamic Imports** - Webpack의 import()를 사용하여 동적으로 모듈을 로드.
 
 ✅ **Loadable Components (SSR를 지원)** - 서버 사이드 렌더링과 코드 스플리팅을 함께 사용하는 경우에 적합.



## 💡 useCallback, useMemo 등 메모이제이션의 과도한 사용이란?

리액트에서 메모이제이션은 성능 최적화를 이루되, 과도한 사용을 피하는 것이 중요하다고 한다. 

그 과도한 사용의 예시에 대해서 궁금했다.

 ✅ **함수나 값이 복잡하고 연산 비용이 큰 경우에만 사용** - 간단한 함수나 값에는 굳이 메모이제이션을 사용할 필요가 없다.

 ✅ **컴포넌트의 렌더링 빈도** - 자주 렌더링되지 않는 컴포넌트에서는 메모이제이션의 이점이 적다.

 ✅ **종속성 배열 크기**  -  종속성 배열이 클 경우, 이를 비교하는 비용이 커질 수 있다.


최적화라는건 항상 느끼지만 경험에 의해서 처음부터 해주는 것도 좋지만 만약 아직경험하지 못한 부분에서 미리 대비하는 것 보다는 실제 문제가 발생하는 경우에 적용하는 것이 좋은 것 같다. 

그런 경험이 쌓여서 처음부터 대비할 수 있는 능력이 생기는 것 같다.



## 💡 React.StrictMode는 무엇인가?

![](https://velog.velcdn.com/images/whitewise95/post/2a894700-b390-4ffd-a08c-e42ab18a0e2f/image.png)

항상 개발을 하고 로그를 출력해보면 두번씩 출력되는 걸 확인 할 수 있는데 가끔 불편 할 때가 있어서 알아보니 React.StrictMode를 주석처리하면 그런 일이 없어진다고 한다.

근데 막상 주석처리해서 개발하다보니 왜 이런 불편한 게 있는 걸까? 라는 궁금증이 생겨서 찾아보았다.

`react의 공식 문서`에서 살펴보면 `strict 모드란 react 앱 내의 잠재적인 문제를 알아내기 위한 도구`라고 나와있다고 한다.

`리액트`는 생명주기 메서드가 호출하면서 `렌더링 단계와 커밋 단계 두가지의 단계로 동작`한다. 

이 동작과정에서 `Strict 모드가 생명주기 메서드가 비정상적으로 여러번 호출되는 걸 감지`하는데, `문제가 될 만한 함수를 두 번 실행하는 방법으로써 이러한 발견을 도와준다.` 즉, Double-Invoke 방식을 통해 이를 우리에게 알려주는 것!

> 만약 double invoke가 실행되었을 때 두개의 결과 값이 서로 다르다면? 해당 코드는 문제가 있다는 뜻이 된다.
>
> 우선 strict 모드는 개발 과정 중에만 적용이 되고 포가 되고나면 strict 모드는 저절로 작동하지 않는다.
