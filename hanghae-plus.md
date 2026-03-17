---
layout: page
title: 항해플러스
permalink: /hanghae-plus/
---

항해플러스 시리즈를 GitHub 블로그용으로 옮겨 정리한 목록입니다.

{% assign hanghae_posts = site.categories["항해플러스"] %}
{% if hanghae_posts == nil or hanghae_posts == empty %}
  {% assign hanghae_posts = "" | split: "" %}
{% else %}
  {% assign hanghae_posts = hanghae_posts | sort: "date" | reverse %}
{% endif %}

{% if hanghae_posts and hanghae_posts.size > 0 %}
<section class="series-board" aria-label="Hanghae plus posts board">
  <div class="series-board-head">
    <p class="series-board-subtitle">항해플러스 백엔드 과정 회고와 실습 기록을 시간순으로 모았습니다.</p>
  </div>

  <ul class="series-board-list">
  {% for post in hanghae_posts %}
    <li class="series-board-item">
      <a class="series-board-link" href="{{ post.url | relative_url }}">
        <div class="series-board-main">
          <span class="series-board-badge">항해플러스</span>
          <h3 class="series-board-title">{{ post.title }}</h3>
          <p class="series-board-meta">벨로그 시리즈를 옮겨 정리한 학습/회고 기록</p>
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
아직 항해플러스 카테고리 글이 없습니다.
{% endif %}
