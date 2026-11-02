# ΛΞVOS Setup & Deployment Guide
**Enterprise Entity:** ΛΞV Inc | *The Future Needs Context* | *Innovate, Automate, Dominate*  
**Environment Specification:** Node.js 22+, Angular 21+, Docker 24+, Caddy 2.8+

---

## 1. Local Development Setup

### 1.1 Prerequisites
- **Node.js**: v22.0.0 or higher
- **Package Managers**: `npm` (v10+) or `bun` (v1.1+)
- **Git**

### 1.2 Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url> lxvos
   cd lxvos
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Populate the required keys:
   ```env
   # Control Plane & Gemini AI API
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Appwrite Configuration (Optional / Self-Hosted)
   APPWRITE_ENDPOINT=http://localhost:20080/v1
   APPWRITE_PROJECT_ID=lxvos-cloud
   APPWRITE_API_KEY=your_appwrite_api_key_here
   
   # Polar.sh Billing Credentials (Optional)
   POLAR_ACCESS_TOKEN=your_polar_token_here
   POLAR_ORGANIZATION_ID=your_org_id_here
   ```

4. **Launch Development Server:**
   ```bash
   npm run start
   ```
   The application will bind to `http://0.0.0.0:3000`. The Express server runs seamlessly as Vite middleware, serving both the Angular SSR application and all `/api/*` backend routes on the same port.

---

## 2. Testing & Quality Assurance

### 2.1 Unit Tests (Vitest)
Unit tests validate the core state management services (`WindowManagerService`, `DesktopIconsService`, `PolarBillingService`, `XiEconomyService`, `AuthRbacService`, etc.):
```bash
# Run unit tests once
npm run test:unit

# Run unit tests in interactive watch mode
npx vitest
```

### 2.2 End-to-End Tests (Bun Test Runner)
E2E tests verify the complete multi-tenant workflow and edge database sync:
```bash
bun test
```

### 2.3 Static Analysis & Linting
Validate syntax, strict typing, and Angular best practices:
```bash
npm run lint
```

### 2.4 Production Build
Compile the application with Angular Ahead-of-Time (AOT) and SSR optimization:
```bash
npm run build
```

---

## 3. Production Deployment with Docker & Caddy

### 3.1 Docker Container Build
The root `Dockerfile` packages the production server and built client bundles into an alpine container:

```bash
# Build the production Docker image
docker build -t lxvos:latest .

# Run the container exposing port 3000
docker run -d \
  --name lxvos-app \
  -p 3000:3000 \
  -e GEMINI_API_KEY="your_api_key" \
  lxvos:latest
```

### 3.2 Docker Compose Multi-Service Stack
To run the full operating system stack with self-hosted Appwrite and edge cache:
```bash
docker compose up -d
```

### 3.3 Reverse Proxy with Caddy (`Caddyfile`)
The included `Caddyfile` provides automatic TLS, WebSocket proxying, and compression:

```caddy
lxv.cloud {
    encode gzip zstd
    
    # Static assets cache
    @static path /assets/* /favicon.ico /manifest.json
    header @static Cache-Control "public, max-age=31536000, immutable"

    # API and SSR reverse proxy
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

---

## 4. Self-Hosted Appwrite Integration

For local database and IAM isolation, run the self-hosted Appwrite stack:

```bash
# Start Appwrite services
docker run -it --rm \
    --publish 20080:20080 \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:2.5.0
```

Access the console at `http://localhost:20080` to create your master project and API keys.
