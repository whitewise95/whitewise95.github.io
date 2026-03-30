---
layout: page
title: TIL
permalink: /til/
---

Today I Learned 형식으로 정리한 개발 기록입니다.

{% assign til_posts = site.categories["TIL"] %}
{% if til_posts == nil or til_posts == empty %}
  {% assign til_posts = "" | split: "" %}
{% else %}
  {% assign til_posts = til_posts | sort: "date" | reverse %}
{% endif %}

{% if til_posts and til_posts.size > 0 %}
<section class="series-board" aria-label="TIL posts board">
  <div class="series-board-head">
    <p class="series-board-subtitle">트러블슈팅, 설계 의사결정, 구현 노하우를 주제별로 정리했습니다.</p>
  </div>

  <ul class="series-board-list">
  {% for post in til_posts %}
    <li class="series-board-item">
      <a class="series-board-link" href="{{ post.url | relative_url }}">
        <div class="series-board-main">
          <span class="series-board-badge">TIL</span>
          <h3 class="series-board-title">{{ post.title }}</h3>
          <p class="series-board-meta">실무 개발 중 학습한 내용</p>
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
아직 TIL 카테고리 글이 없습니다.
{% endif %}
