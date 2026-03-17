---
layout: page
title: 리액트 부트캠프
permalink: /react-bootcamp/
---

내일배움캠프 리액트 과정 프로젝트/회고를 GitHub 블로그용으로 정리한 목록입니다.

{% assign react_bootcamp_posts = site.categories["리액트 부트캠프"] %}
{% if react_bootcamp_posts == nil or react_bootcamp_posts == empty %}
  {% assign react_bootcamp_posts = "" | split: "" %}
{% else %}
  {% assign react_bootcamp_posts = react_bootcamp_posts | sort: "date" | reverse %}
{% endif %}

{% if react_bootcamp_posts and react_bootcamp_posts.size > 0 %}
<section class="series-board" aria-label="React bootcamp posts board">
  <div class="series-board-head">
    <p class="series-board-subtitle">리액트 과정에서 진행한 프로젝트와 트러블슈팅 경험을 모았습니다.</p>
  </div>

  <ul class="series-board-list">
  {% for post in react_bootcamp_posts %}
    <li class="series-board-item">
      <a class="series-board-link" href="{{ post.url | relative_url }}">
        <div class="series-board-main">
          <span class="series-board-badge">리액트 부트캠프</span>
          <h3 class="series-board-title">{{ post.title }}</h3>
          <p class="series-board-meta">내일배움캠프 리액트 과정 기록</p>
        </div>
        <time class="series-board-date" datetime="{{ post.date | date_to_xmlschema }}">
          {{ post.date | date: "%Y-%m-%d" }}
        </time>
      </a>
    </li>
  {% endfor %}
  </ul>
</section>
{% else %}
아직 리액트 부트캠프 카테고리 글이 없습니다.
{% endif %}
