---
layout: page
title: Java 카테고리
permalink: /java/
---

Java 카테고리 글 목록입니다.

{% assign java_posts = site.categories.Java %}

{% if java_posts and java_posts.size > 0 %}
| 제목 | 날짜 |
|---|---|
{% for post in java_posts %}
| [{{ post.title }}]({{ post.url | relative_url }}) | {{ post.date | date: "%Y-%m-%d" }} |
{% endfor %}
{% else %}
아직 Java 카테고리 글이 없습니다.
{% endif %}
