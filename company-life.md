---
layout: page
title: 회사생활
permalink: /company-life/
---

회사생활 시리즈를 GitHub 블로그용으로 옮겨 정리한 목록입니다.

{% assign company_posts = site.categories["회사생활"] %}
{% if company_posts == nil or company_posts == empty %}
  {% assign company_posts = "" | split: "" %}
{% else %}
  {% assign company_posts = company_posts | sort: "date" | reverse %}
{% endif %}

{% if company_posts and company_posts.size > 0 %}
<section class="series-board" aria-label="Company life posts board">
  <div class="series-board-head">
    <p class="series-board-subtitle">회사에서 겪은 일, 설계 고민, 프로젝트 회고를 시간순으로 모았습니다.</p>
  </div>

  <ul class="series-board-list">
  {% for post in company_posts %}
    <li class="series-board-item">
      <a class="series-board-link" href="{{ post.url | relative_url }}">
        <div class="series-board-main">
          <span class="series-board-badge">회사생활</span>
          <h3 class="series-board-title">{{ post.title }}</h3>
          <p class="series-board-meta">벨로그 시리즈에서 정리해 옮긴 회고와 업무 기록</p>
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
아직 회사생활 카테고리 글이 없습니다.
{% endif %}
