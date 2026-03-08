---
layout: page
title: 카테고리
permalink: /categories/
---

{% assign category_names = site.categories | map: "first" | sort %}

{% if category_names.size > 0 %}
  {% for category_name in category_names %}
## {{ category_name }} ({{ site.categories[category_name].size }})

  {% for post in site.categories[category_name] %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%Y-%m-%d" }}
  {% endfor %}

  {% endfor %}
{% else %}
아직 카테고리가 없습니다.
{% endif %}
