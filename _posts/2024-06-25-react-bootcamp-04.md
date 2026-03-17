---
layout: post
title: "[내배캠:리액트과정] 아웃소싱 팀 프로젝트 개발기 "
date: 2024-06-25 00:00:00 +0900
categories: [리액트 부트캠프]
tags: [리액트, 내일배움캠프, 프로젝트, 회고]
permalink: /react-bootcamp/react-bootcamp-04/
---

> 원문: https://velog.io/@whitewise95/내배캠리액트과정-아웃소싱-팀-프로젝트-개발기

## 글 소개

아웃소싱 팀 프로젝트를 진행하며 팀 협업 방식, 역할 분담, API 연동 과정에서의 의사결정과 트러블슈팅 경험을 정리한 글입니다.

## 본문

![](https://velog.velcdn.com/images/whitewise95/post/6287e0c4-6541-455b-b35f-fa3b50a8ba7e/image.png)

17일 아웃소싱 팀프로젝트의 발제가 시작되었다.

아웃소싱 프로젝트는 지도API or 유뷰브API 그리고 설문조사형식의 웹개발을 목표로 진행하는 프로젝트이며, 총 6명으로 팀이 구성되었고, 역대 최대인원이였다!!

그리고 항상 팀장을 맡던 내가 이번에는 팀장이 아니라 다른분이 팀장이 되었다.

팀프로젝트가 끝나고 보니 팀장의 리더십으로 이 프로젝트가 잘 마무리된 것 같아서 많이 배우고 좋은 사람 한 분 알게 되어서 뜻 깊은 프로젝트였던거 같다.

# 📕 개발기
이번 팀은 인재들이 많았다. 
디자이너 경험이 있으신 팀원도 계셨고, 퍼블리셔 경험이 있는 팀원도 있었다. 


## 기획 
기획은 내가 말한 아이디어에서 1-a 를 채택하고 발전해서 최종적으로 
지도API를 사용하고 산책하기 좋은 위치 중심의 커뮤니티 사이트를 컨셉으로 기획으로 FIX 하고 산책하기 좋은 공원이나 산책로를 추천해주는 웹개발이 진행되었다. 
![](https://velog.velcdn.com/images/whitewise95/post/64d5a1b1-126e-44e4-93f0-03f7b6568444/image.png)  


우리 프로젝트의 구조는
현재 내 위치와 인기 게시물을 보여주는 `메인페이지`
로그인과 회원가입을 할 수 있는 `로그인과, 회원가입 (모달형식)`
자신이 쓴글과 좋아요한 글 그리고 정보수정을 할 수 있는 `마이페이지`
산책 리스트를 볼 수 있고 검색과 필터링을 할 수 있는 `산책 리스트 페이지`
관심있는 글이 보였을 때 상세하게 볼 수 있는 `상세페이지`
자신의 산책로를 공유할 수 있는 `글 작성/수정페이지` 등으로 구성을 했다. 
![](https://velog.velcdn.com/images/whitewise95/post/c1566d75-7316-4642-8980-0cbc446ca1cc/image.png)



## 디자인 및 화면설계
우리팀에는 디자인과 웹퍼블리싱 경험이 있는 인재들이 존재했기에 오래 걸리지 않고 퀄리티 좋은 화면설계를 할 수 있었다.

![](https://velog.velcdn.com/images/whitewise95/post/dd2e11fc-df22-4897-92cf-04ac8ff48382/image.png)
![](https://velog.velcdn.com/images/whitewise95/post/385e0cdb-35f2-4009-9ecd-bf4215021d54/image.png)
![](https://velog.velcdn.com/images/whitewise95/post/09fe6e55-74e7-4da2-93fa-d9008d3ceee4/image.png)




## 기능 분담

우선 각 페이지마다 기능들을 정리했다.
![](https://velog.velcdn.com/images/whitewise95/post/c0ae494a-c143-4117-9207-7c1795d0935d/image.png)

![](https://velog.velcdn.com/images/whitewise95/post/4dad9781-8396-4d4a-b4d5-608a0deb01cd/image.png)
왜 이리... 많지??
팀원이 6명이라 정말 다행이다...


각자 원하는 기능들을 하나씩 가져갔다. 
나는 기능을 분담할 때 최대한 늦게 가져가려고한다.
누구는 피하고 싶은 기능이  있을 것이고, 누구는 도전해보고싶은 기능이 있을 텐데 이해하기 때문에 최대한 팀원들이 다 고르고 남은 기능들을 가져가려고 배려를 하는 편이다. 

기능 분담을 다 완료했다.
![](https://velog.velcdn.com/images/whitewise95/post/06d46875-74bf-402a-bbd6-c185668c8fdc/image.png)



## 카카오 지도 API 

[카카오지도 API 가이드](https://apis.map.kakao.com/web/guide/) 에 잘 나와있기도 하고 샘플로도 많이 있어서 초반 셋팅 외에는 큰 어려움은 없었던 거 같다.

정말 초반셋팅과... 커스텀이 힘들었을 뿐?! 
![](https://velog.velcdn.com/images/whitewise95/post/bb0289ce-4573-4486-a349-29ceafb308f0/image.png)


지도 API를 사용하는 곳은 메인페이지와 글 작성시 지도 API가 필요했데 두 곳에서는 각 다른 기능을 한다. 
그리고 각 두 곳에서 잘 사용할 수 있게 컴포넌트화를 시켜줘야하는데.... 어떻게 해야 내가 만든 컴포넌트를 잘 몰라도 잘 사용할 수 있게 개발할지...긴 시간 고민을 많이 한 것 같다.


### 자신의 위치와 글목록을 받아 각 글들의 위치를 띄어주는 컴포넌트
![](https://velog.velcdn.com/images/whitewise95/post/91939976-129a-4df4-a344-89c4b38554eb/image.png)

### 지도검색을 기반으로 선택한 주소를 지도에 띄어주는 컴포넌트
> 마크 이미지를 커스텀했는데 해당이미지가... 삭제되어서 액박이...

![](https://velog.velcdn.com/images/whitewise95/post/4dc932e7-c19c-4f31-a95e-4146f9887b9f/image.png)

### 작성한 글의 위도와 경도를 받아 지도를 띄어주는 컴포넌트
![](https://velog.velcdn.com/images/whitewise95/post/1226825b-0d05-4a3b-a5a3-1d4d56be467d/image.png)
