---
title: "Сборка образа в GHCR и деплой по тегу"
description: "GitHub Actions собирает образ, а деплой по SSH запускается только на релизном теге."
date: 2026-10-20
tags: [github-actions, docker]
draft: true
---

Сборка и публикация образа в GitHub Container Registry идут из GitHub Actions. Человекочитаемые теги создаёт `docker/metadata-action`: имя ветки, `sha-…` и semver.

## Принципы

- Деплой запускается только на теге вида `v1.2.0`, а не на каждом пуше.
- В compose на сервере указывается неизменяемый тег, а не `latest`.
- Значение тега передаётся в SSH-скрипт через переменную окружения, а не подстановкой в текст команды.
- Секреты: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_FINGERPRINT`.

## Откат

Измените `TAG` в `.env` на сервере на предыдущую версию и выполните `docker compose up -d`.
