# Live Browser

This folder contains a Coolify-compatible Docker Compose service for a persistent browser you can open from your browser.

## Purpose

Use this for manual login and review sessions for tools such as Google, WordPress, Buffer, ChatGPT, and Claude.

## Coolify deployment

1. Open Coolify.
2. Go to your project and environment.
3. Add a new Docker Compose resource.
4. Use this compose file:

```text
live-browser/docker-compose.yml
```

5. Add environment variables:

```text
LIVE_BROWSER_USER=awais
LIVE_BROWSER_PASSWORD=your-strong-password
```

6. Deploy.

## Ports

The compose file exposes:

```text
3010 -> container 3000
3011 -> container 3001
```

Use the HTTPS/web UI port first:

```text
https://YOUR-SERVER-IP:3011
```

If Coolify provides a domain, point it to the service port `3001` if possible. If that causes TLS issues, use service port `3000` and let Coolify handle HTTPS.

## Security

This browser can contain logged-in sessions. Treat it like a password vault.

- Use a strong password.
- Do not share the URL.
- Do not expose it publicly without authentication.
- Do not store browser profile data in GitHub.
- Use separate browser profiles/accounts later for different clients or Google accounts.
