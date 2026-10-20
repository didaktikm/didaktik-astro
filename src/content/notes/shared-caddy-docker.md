---
title: "Общий Caddy для нескольких сайтов в Docker"
description: "Один прокси занимает 80/443, сайты живут в своих compose-стеках без опубликованных портов."
date: 2026-10-20
tags: [docker, caddy]
draft: true
---

Один Caddy занимает порты 80 и 443 и хранит сертификаты. Остальные сервисы работают в отдельных compose-стеках и подключаются к общей внешней сети `proxy`, не публикуя портов.

## Стек прокси

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443", "443:443/udp"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks: [proxy]
volumes:
  caddy_data:
  caddy_config:
networks:
  proxy:
    name: proxy
```

## Подводные камни

- Сертификаты хранятся в томе `caddy_data`, а не в образе.
- Имя в `reverse_proxy` должно совпадать с `container_name` сервиса.
- Базы данных держите во внутренних сетях своих стеков, а не в `proxy`.
- Если упадёт один upstream, остальные сайты продолжат работать.
