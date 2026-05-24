---
layout: page
title: 스프링배치
permalink: /spring-batch/
---

Spring Batch 학습/실습 글 목록입니다.

{% assign batch_posts = site.categories["스프링배치"] %}
{% if batch_posts == nil or batch_posts == empty %}
  {% assign batch_posts = "" | split: "" %}
{% else %}
  {% assign batch_posts = batch_posts | sort: "date" | reverse %}
{% endif %}

{% if batch_posts and batch_posts.size > 0 %}
<section class="series-board" aria-label="Spring Batch posts board">
  <div class="series-board-head">
    <p class="series-board-subtitle">공식 문서 기반으로 처음부터 차근차근 정리합니다.</p>
  </div>

  <ul class="series-board-list">
  {% for post in batch_posts %}
    <li class="series-board-item">
      <a class="series-board-link" href="{{ post.url | relative_url }}">
        <div class="series-board-main">
          <span class="series-board-badge">스프링배치</span>
          <h3 class="series-board-title">{{ post.title }}</h3>
          <p class="series-board-meta">CSV -> DB 배치 실습 문서</p>
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
아직 스프링배치 카테고리 글이 없습니다.
{% endif %}
