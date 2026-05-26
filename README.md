# n8n Playwright Service

A lightweight Playwright + Chromium automation service for n8n workflows.

## Endpoints

### Health check

GET /

### Run browser automation

POST /run

Body:

```json
{
  "url": "https://example.com"
}
```

Example response:

```json
{
  "success": true,
  "title": "Example Domain",
  "text": "Example page content"
}
```

## Deploy with Coolify

- Build Pack: Dockerfile
- Port: 3000
