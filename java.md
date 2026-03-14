---
layout: page
title: Java 버전별 정리
permalink: /java/
---

Java 버전별 주요 변경사항 포스트 모음입니다.

{% assign java_posts = site.categories["Java"] %}
{% if java_posts == nil or java_posts == empty %}
  {% assign java_posts = "" | split: "" %}
{% else %}
  {% assign java_posts = java_posts | sort: "date" | reverse %}
{% endif %}

{% if java_posts and java_posts.size > 0 %}
<section class="series-board" aria-label="Java posts board">
  <div class="series-board-head">
    <p class="series-board-subtitle">최신 버전부터 순서대로 확인할 수 있습니다.</p>
  </div>

  <ul class="series-board-list">
  {% for post in java_posts %}
    {% assign version = post.title | remove: "Java " | split: " " | first %}
    <li class="series-board-item">
      <a class="series-board-link" href="{{ post.url | relative_url }}">
        <div class="series-board-main">
          <span class="series-board-badge">Java {{ version }}</span>
          <h3 class="series-board-title">{{ post.title }}</h3>
          <p class="series-board-meta">릴리스 변경사항 정리 문서</p>
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
아직 Java 카테고리 글이 없습니다.
{% endif %}
