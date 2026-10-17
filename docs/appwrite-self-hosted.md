# Self-Hosted Appwrite & MCP Integration Guide

This guide outlines self-hosted Appwrite deployment (Appwrite v2.5.0), Local MCP Server setup over `stdio`, and SDK version compatibility.

---

## 1. Local MCP Server (`mcp-server-appwrite`) Setup

Run the MCP server locally over `stdio` and authenticate with a project API key:

```bash
APPWRITE_PROJECT_ID=<YOUR_PROJECT_ID> \
APPWRITE_API_KEY=<YOUR_API_KEY> \
APPWRITE_ENDPOINT=http://localhost:9501/v1 \
uvx mcp-server-appwrite
```

### IDE Configuration Examples

#### Cursor (`~/.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "appwrite": {
      "command": "uvx",
      "args": ["mcp-server-appwrite"],
      "env": {
        "APPWRITE_PROJECT_ID": "<YOUR_PROJECT_ID>",
        "APPWRITE_API_KEY": "<YOUR_API_KEY>",
        "APPWRITE_ENDPOINT": "http://localhost:9501/v1"
      }
    }
  }
}
```

#### VS Code (`.vscode/mcp.json`)
```json
{
  "servers": {
    "appwrite": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-appwrite"],
      "env": {
        "APPWRITE_PROJECT_ID": "<YOUR_PROJECT_ID>",
        "APPWRITE_API_KEY": "<YOUR_API_KEY>",
        "APPWRITE_ENDPOINT": "http://localhost:9501/v1"
      }
    }
  }
}
```

---

## 2. Docker Installation (Appwrite 2.5.0)

To install Appwrite locally using Docker:

```bash
docker run -it --rm \
    --publish 20080:20080 \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:2.5.0
```

Navigate to `http://localhost:20080` to complete the 4-step setup wizard.

---

## 3. Server SDK Compatibility Matrix

For **Appwrite v2.5.0**, ensure your Go server SDK is pinned to matching versions:
- **Go Server SDK**: `v7.3.0` (or `v7`)
- **Node.js SDK**: `29.0.0`
- **Python SDK**: `24.0.0`
- **PHP SDK**: `30.0.0`
