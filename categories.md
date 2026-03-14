---
layout: page
title: 카테고리
permalink: /categories/
---

전체 카테고리 목록입니다.

{% assign category_names = site.categories | map: "first" | sort %}

{% if category_names.size > 0 %}
<section class="series-board" aria-label="Category list">
  <div class="series-board-head">
    <p class="series-board-subtitle">카테고리별로 글을 모아볼 수 있습니다.</p>
  </div>

  <ul class="series-board-list">
  {% for category_name in category_names %}
    {% assign category_posts = site.categories[category_name] | sort: "date" | reverse %}
    <li class="series-board-item">
      <a class="series-board-link" href="{% if category_name == 'Java' %}{{ '/java/' | relative_url }}{% elsif category_name == '회사생활' %}{{ '/company-life/' | relative_url }}{% else %}{{ '/categories/' | relative_url }}{% endif %}">
        <div class="series-board-main">
          <span class="series-board-badge">{{ category_name }}</span>
          <h3 class="series-board-title">{{ category_name }}</h3>
          <p class="series-board-meta">{{ category_posts.size }}개의 글이 있습니다.</p>
        </div>
        <span class="series-board-date">{{ category_posts.size }} posts</span>
      </a>
    </li>
  {% endfor %}
  </ul>
</section>
{% else %}
아직 카테고리가 없습니다.
{% endif %}
