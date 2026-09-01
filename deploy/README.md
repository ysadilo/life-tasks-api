# Raspberry Pi deployment — backend

Deploy first (owns Postgres + the shared network). Then do the frontend repo.

## One-time Pi setup

Assumes 64-bit Raspberry Pi OS (arm64) on a Pi 4/5.

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER        # re-login after this

# Shared network for both compose projects
docker network create life-tasks

# Repos (siblings under ~)
git clone https://github.com/yuliiasadilo/life-tasks-backend.git ~/life-tasks-backend
git clone https://github.com/yuliiasadilo/life-tasks-frontend.git ~/life-tasks-frontend

# Backend env
cd ~/life-tasks-backend/deploy
cp .env.example .env && nano .env    # POSTGRES_PASSWORD, AUTH0_DOMAIN, AUTH0_AUDIENCE

# GHCR is private by default — log in once so `compose pull` works
echo <GHCR_PAT> | docker login ghcr.io -u yuliiasadilo --password-stdin
```

## Network / DNS

- Point an A record for your domain at the Pi's public IP (use a dynamic-DNS
  provider if your ISP IP changes).
- Forward router ports **80** and **443** to the Pi. Caddy (frontend repo) needs
  both to get and renew the Let's Encrypt cert. The backend exposes no host ports.

## GitHub Actions secrets (this repo → Settings → Secrets → Actions)

| Secret       | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| `PI_HOST`    | Pi public IP or hostname                                              |
| `PI_USER`    | SSH user (e.g. `pi`)                                                  |
| `PI_SSH_KEY` | private key whose public half is in the Pi's `~/.ssh/authorized_keys` |

`GITHUB_TOKEN` is automatic and pushes the image to `ghcr.io/yuliiasadilo/life-tasks-backend`.

## Deploy

Push to `main` → the workflow builds the arm64 image, pushes to GHCR, SSHes in,
and runs `docker compose pull && up -d` in `deploy/`. Migrations
(`prisma migrate deploy`) run automatically on container start.

Manual first run:

```bash
cd ~/life-tasks-backend/deploy && docker compose up -d
```

## Backups (do this yourself, not automated here)

```bash
docker compose exec postgres pg_dump -U life_tasks life_tasks > backup-$(date +%F).sql
```
