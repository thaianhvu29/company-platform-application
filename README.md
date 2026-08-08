# Company Platform — CI/CD, GitOps & Kubernetes

A production-oriented DevOps project that demonstrates how applications are **built, secured, released, deployed, and monitored on Kubernetes**.

The project focuses on the software delivery and operations workflow around the application: CI/CD, container security, GitOps, Kubernetes deployment, and monitoring.

---

## 🚀 What Does This Project Do?

The platform automates the software delivery process from source code to Kubernetes:

```text
Developer
    ↓
Pull Request
    ↓
GitHub Actions CI
    ↓
Application Validation
    ↓
Docker Build
    ↓
Trivy Security Scan
    ↓
Push Images to GHCR
    ↓
Automated GitOps Pull Request
    ↓
Human Approval
    ↓
Argo CD
    ↓
Kubernetes
    ↓
Prometheus / Grafana
```

Instead of letting CI deploy directly to Kubernetes, the project uses a separate GitOps repository.

This provides a controlled deployment process where **Git is the source of truth** and Argo CD is responsible for synchronizing the cluster.

---

## 🏗️ Application Architecture

The demo application contains three containerized Node.js services:

```text
                    Client
                       │
                       ▼
                Traefik Ingress
                       │
                       ▼
                 API Gateway
                  /        \
                 /          \
                ▼            ▼
        Order Service   Payment Service
```

Each service exposes operational endpoints:

```text
/health    → Kubernetes liveness check
/ready     → Kubernetes readiness check
/metrics   → Prometheus-compatible metrics
```

The business logic is intentionally simple because the main purpose of this project is to demonstrate the infrastructure and software delivery platform.

---

## 📦 Repository Model

The platform is separated into two repositories.

### Application Repository

**company-platform-application**

Contains:

- Node.js services
- Dockerfiles
- GitHub Actions workflows
- CI validation
- Trivy security scanning
- Container release pipeline
- Automated GitOps image promotion

### GitOps Repository

**company-platform-gitops**

https://github.com/thaianhvu29/company-platform-gitops

Contains:

- Kubernetes manifests
- Staging environment configuration
- Container image versions
- Argo CD configuration
- Prometheus and Grafana configuration

The separation ensures that the CI pipeline does not need direct deployment access to the Kubernetes cluster.

---

## 🔄 CI/CD & GitOps Workflow

### 1. Pull Request Validation

When application code is pushed through a Pull Request, GitHub Actions validates all services.

```text
Install Dependencies
        ↓
Validate Application
        ↓
Start Service
        ↓
Check /health
        ↓
Check /ready
        ↓
Check /metrics
        ↓
Build Docker Image
        ↓
Trivy Security Scan
```

If validation fails or unacceptable HIGH / CRITICAL vulnerabilities are detected, the pipeline fails and prevents the change from progressing.

### 2. Container Release

After the Pull Request is approved and merged into `main`, the release pipeline builds and scans container images again.

Successful images are pushed to GitHub Container Registry.

Images use immutable Git SHA tags:

```text
ghcr.io/thaianhvu29/api-gateway:sha-<git-commit>
ghcr.io/thaianhvu29/order-service:sha-<git-commit>
ghcr.io/thaianhvu29/payment-service:sha-<git-commit>
```

This makes it possible to trace a running Kubernetes container back to the exact source-code commit.

### 3. Automated GitOps Promotion

The release workflow does not execute `kubectl apply`.

Instead:

```text
New Images Released
        ↓
Clone GitOps Repository
        ↓
Update Kubernetes Image SHA
        ↓
Create Promotion Branch
        ↓
Create GitOps Pull Request
        ↓
Human Approval
        ↓
Merge to GitOps main
```

### 4. Kubernetes Deployment

After the GitOps Pull Request is merged:

```text
GitOps Repository
        ↓
Argo CD
        ↓
Detect Desired State Change
        ↓
Kubernetes Rolling Update
        ↓
New Application Version Running
```

This creates a clear separation between **building software** and **deploying software**.

---

## ☸️ Kubernetes Practices

The staging environment currently runs on **k3s Kubernetes**.

Application workloads use:

| Practice | Purpose |
|---|---|
| Liveness Probe | Detect unhealthy containers |
| Readiness Probe | Prevent traffic reaching unready containers |
| CPU / Memory Requests | Reserve required resources |
| CPU / Memory Limits | Control maximum resource usage |
| SecurityContext | Run containers securely |
| ClusterIP Services | Internal service communication |
| Traefik Ingress | External application access |
| Rolling Updates | Deploy new versions without replacing everything at once |

Containers run as non-root users:

```yaml
runAsNonRoot: true
runAsUser: 1000
runAsGroup: 1000
allowPrivilegeEscalation: false

capabilities:
  drop:
    - ALL
```

---

## 🔐 Container Security

Application services use multi-stage Docker builds and hardened runtime images.

Security practices include:

```text
Production-only dependencies
        +
Non-root runtime user
        +
Reduced runtime packages
        +
Immutable image versions
        +
Trivy vulnerability scanning
```

During development, Trivy detected HIGH and CRITICAL vulnerabilities in runtime packages.

The pipeline correctly blocked the release.

The runtime image was then hardened and rescanned until it passed the security gate.

---

## 🔁 GitOps & Self-Healing

Argo CD continuously compares the Kubernetes cluster with the desired state stored in Git.

Enabled capabilities:

```text
Auto Sync
Prune
Self Heal
```

A drift scenario was tested by manually changing the API Gateway replica count directly in Kubernetes.

```text
Git Desired State
        ↓
Manual Cluster Change
        ↓
Argo CD Detects Drift
        ↓
Self Heal
        ↓
Cluster Restored to Git State
```

This confirms that Git remains the source of truth even when manual changes occur inside the cluster.

---

## 📊 Monitoring

The Kubernetes monitoring stack currently includes:

| Component | Purpose |
|---|---|
| Prometheus | Collect and store metrics |
| Grafana | Visualize monitoring data |
| kube-state-metrics | Kubernetes object metrics |
| node-exporter | Node CPU, memory and system metrics |
| Prometheus Operator | Manage Prometheus resources |

Monitoring is also managed through GitOps.

```text
Kubernetes
     ↓
Prometheus
     ↓
Grafana
```

Prometheus currently uses persistent local storage and short retention suitable for the current staging environment.

---

## 🛠️ Operational Troubleshooting

The project also includes real troubleshooting scenarios encountered during implementation.

### Container Security Issue

Trivy detected vulnerable runtime packages.

```text
Trivy Detection
      ↓
CI Failure
      ↓
Docker Image Investigation
      ↓
Runtime Image Hardening
      ↓
Rebuild
      ↓
Security Gate Passed
```

### Kubernetes Non-Root Container Issue

Kubernetes initially rejected a container because the image used a named non-root user.

The runtime UID/GID was inspected and explicitly configured as UID/GID `1000`.

### Configuration Drift

A Kubernetes Deployment was manually modified outside Git.

Argo CD detected the drift and automatically restored the Git-defined configuration.

### Automated Image Promotion

A successful application release automatically created a Pull Request in the GitOps repository containing new immutable image SHA values.

After approval, Argo CD deployed the new images to Kubernetes.

### Grafana Startup Problem

Grafana experienced startup delays because optional plugins attempted to download from external services and timed out.

Container logs were used to identify the issue and automatic plugin preinstallation was disabled through GitOps.

### Grafana Resource Saturation

Grafana later became slow and requests began timing out.

Runtime metrics showed approximately:

```text
CPU usage:     ~201m
CPU limit:      200m

Memory usage:  ~239Mi
Memory limit:   256Mi
```

The resource limits were adjusted through the GitOps workflow.

This demonstrated a typical operations flow:

```text
Observe Problem
      ↓
Inspect Logs / Metrics
      ↓
Identify Bottleneck
      ↓
Modify Git Configuration
      ↓
Pull Request
      ↓
Argo CD Reconciliation
      ↓
Validate Result
```

---

## 🧰 Technology Stack

| Area | Technology |
|---|---|
| Application | Node.js, Express |
| Version Control | Git |
| Repository | GitHub |
| CI/CD | GitHub Actions |
| Containers | Docker |
| Container Registry | GitHub Container Registry |
| Security Scanning | Trivy |
| Kubernetes | k3s |
| Ingress | Traefik |
| GitOps | Argo CD |
| Kubernetes Packaging | Helm |
| Metrics | Prometheus |
| Visualization | Grafana |
| Kubernetes Metrics | kube-state-metrics |
| Node Metrics | node-exporter |

---

## ✅ Current Project Status

| Capability | Status |
|---|---|
| Three containerized services | ✅ Implemented |
| Multi-stage Docker builds | ✅ Implemented |
| Non-root containers | ✅ Implemented |
| Pull Request CI | ✅ Implemented |
| Application health validation | ✅ Implemented |
| Trivy security gate | ✅ Implemented |
| GHCR container release | ✅ Implemented |
| Immutable SHA image tags | ✅ Implemented |
| Kubernetes staging environment | ✅ Implemented |
| Readiness / Liveness probes | ✅ Implemented |
| Resource Requests / Limits | ✅ Implemented |
| Traefik Ingress | ✅ Implemented |
| Separate GitOps repository | ✅ Implemented |
| Argo CD | ✅ Implemented |
| Auto Sync / Prune / Self Heal | ✅ Implemented |
| Automated image promotion | ✅ Implemented |
| Prometheus | ✅ Implemented |
| Grafana | ✅ Implemented |
| Application monitoring dashboard | 🔄 Next Phase |
| Alerting | 🔄 Next Phase |
| Incident / Rollback scenario | 🔄 Next Phase |

---

## 🎯 Project Goal

The goal of this project is to build and understand an end-to-end software delivery platform:

```text
Code
 ↓
CI
 ↓
Security
 ↓
Container Registry
 ↓
GitOps
 ↓
Kubernetes
 ↓
Monitoring
```

The project focuses on four main engineering principles:

**Automation · Security · Traceability · Operational Visibility**

