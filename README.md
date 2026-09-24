# URL Shortener

A small REST API that shortens URLs, built to demonstrate a full containerized
deployment pipeline: Node.js/TypeScript → Docker → Kubernetes (minikube) →
GitHub Actions CI/CD.

## Stack

- **App:** Node.js, TypeScript, Express, SQLite (via better-sqlite3)
- **Containerization:** Docker (multi-stage build)
- **Orchestration:** Kubernetes, run locally via minikube
- **CI/CD:** GitHub Actions — builds and pushes a Docker image to Docker Hub
  on every push to `main`

## API

| Method | Route       | Description                          |
|--------|-------------|---------------------------------------|
| POST   | `/shorten`  | Body: `{ "url": "https://..." }`. Returns a short code. |
| GET    | `/:code`    | Redirects to the original URL.       |
| GET    | `/health`   | Health check (used by K8s probes).   |

Example:
```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com"}'

# -> {"shortCode":"aB3dE9f","shortUrl":"http://localhost:3000/aB3dE9f","originalUrl":"https://github.com"}

curl -L http://localhost:3000/aB3dE9f   # redirects to github.com
```

## Run locally (no Docker)

```bash
npm install
npm run dev
```

## Run with Docker

```bash
docker build -t url-shortener:v1 .
docker run -p 3000:3000 url-shortener:v1
```

## Deploy to Kubernetes (minikube)

```bash
minikube start

# Point Docker at minikube's internal daemon so it can see the image you build
eval $(minikube docker-env)          # bash/WSL2
# or, PowerShell:
# & minikube -p minikube docker-env | Invoke-Expression

docker build -t url-shortener:v1 .

kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

kubectl get pods
minikube service url-shortener-service   # opens it in a browser
```

## CI/CD

`.github/workflows/ci-cd.yml` builds and pushes a Docker image to Docker Hub
on every push to `main`. Requires two GitHub repo secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN` (a Docker Hub access token, not your password)
