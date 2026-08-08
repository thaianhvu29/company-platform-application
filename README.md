# Company Platform — Production Software Delivery & Kubernetes Operations

A production-oriented software delivery platform demonstrating how containerized services are built, secured, released, promoted, deployed, and operated on Kubernetes using CI/CD, GitOps, and observability practices.

The project is intentionally structured as separate **Application** and **GitOps** repositories to model a real-world separation between application delivery and desired infrastructure state.

---

## 1. Project Goals

This project addresses common software delivery and platform operation problems:

- Inconsistent application builds between environments
- Manual and error-prone deployments
- Lack of security checks before releasing container images
- Mutable or untraceable application versions
- Direct access to Kubernetes during deployment
- Configuration drift between Git and the running cluster
- Difficult rollback and release traceability
- Lack of visibility into Kubernetes workloads
- Lack of standardized health and readiness checks

The platform introduces automated quality gates, immutable container releases, GitOps-based deployment, Kubernetes self-healing, and centralized monitoring.

---

## 2. High-Level Architecture

```mermaid
flowchart TD
    DEV[Developer] --> BRANCH[Feature Branch]
    BRANCH --> PR[Pull Request]

    PR --> CI[GitHub Actions CI]

    CI --> TEST[Application Validation]
    CI --> BUILD[Docker Build]
    CI --> SCAN[Trivy Security Scan]

    TEST --> MERGE[Merge to Main]
    BUILD --> MERGE
    SCAN --> MERGE

    MERGE --> RELEASE[Container Release Pipeline]

    RELEASE --> IMG1[API Gateway Image]
    RELEASE --> IMG2[Order Service Image]
    RELEASE --> IMG3[Payment Service Image]

    IMG1 --> GHCR[GitHub Container Registry]
    IMG2 --> GHCR
    IMG3 --> GHCR

    GHCR --> PROMOTE[Automated GitOps Promotion]

    PROMOTE --> GITOPSPR[GitOps Pull Request]
    GITOPSPR --> APPROVAL[Human Approval]
    APPROVAL --> GITOPS[GitOps Repository]

    GITOPS --> ARGO[Argo CD]

    ARGO --> K8S[Kubernetes / k3s]

    K8S --> API[API Gateway]
    K8S --> ORDER[Order Service]
    K8S --> PAYMENT[Payment Service]

    TRAEFIK[Traefik Ingress] --> API

    PROM[Prometheus] --> K8S
    GRAFANA[Grafana] --> PROM





---

## 3. Repository Architecture

The platform is separated into two repositories to keep application delivery independent from Kubernetes desired state.

### Application Repository

```text
company-platform-application/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
├── api-gateway/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── order-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── payment-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
└── README.md

---

## 11. Kubernetes Networking

Internal application communication uses Kubernetes `ClusterIP` services.

External requests enter through Traefik.

```text
Client
  ↓
Traefik
  ↓
Ingress
  ↓
api.staging.company.local
  ↓
API Gateway Service
  ↓
API Gateway Pods
