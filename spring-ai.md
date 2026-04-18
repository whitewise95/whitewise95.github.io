---
layout: page
title: Spring AI
permalink: /spring-ai/
---

Spring AI 시리즈 목록입니다.

{% assign spring_ai_posts = site.categories["Spring AI"] %}
{% if spring_ai_posts == nil or spring_ai_posts == empty %}
  {% assign spring_ai_posts = "" | split: "" %}
{% else %}
  {% assign spring_ai_posts = spring_ai_posts | sort: "date" | reverse %}
{% endif %}

{% if spring_ai_posts and spring_ai_posts.size > 0 %}
<section class="series-board" aria-label="Spring AI posts board">
  <div class="series-board-head">
    <p class="series-board-subtitle">공식 문서 기준으로 최소 챗 API부터 차근차근 확장합니다.</p>
  </div>

  <ul class="series-board-list">
  {% for post in spring_ai_posts %}
    <li class="series-board-item">
      <a class="series-board-link" href="{{ post.url | relative_url }}">
        <div class="series-board-main">
          <span class="series-board-badge">Spring AI</span>
          <h3 class="series-board-title">{{ post.title }}</h3>
          <p class="series-board-meta">입문 시리즈</p>
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
아직 Spring AI 카테고리 글이 없습니다.
{% endif %}
