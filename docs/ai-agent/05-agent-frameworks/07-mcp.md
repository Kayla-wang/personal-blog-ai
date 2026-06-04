---
title: MCP 协议（工具集成标准）
sidebar_position: 7
tags: [Agent, MCP, 工具, 协议]
---

# MCP 协议

> Model Context Protocol：AI 工具集成的标准化协议

## 概述

MCP（Model Context Protocol）是 Anthropic 推出的开放协议，旨在标准化 AI 模型与外部工具/数据源的集成方式。

## 核心概念

### 1. 为什么需要 MCP

```
现状问题：
- 每个 AI 应用重复实现工具集成
- 工具定义格式不统一
- 缺乏安全和权限标准

MCP 解决：
- 统一的工具发现和调用协议
- 标准化的权限管理
- 可复用的工具服务器
```

### 2. 架构组成

```
MCP 架构：
├── MCP Host    # AI 应用（如 Claude Desktop）
├── MCP Client  # 协议客户端
├── MCP Server  # 工具服务器
└── Transport   # 通信层（stdio/HTTP）
```

### 3. 核心能力

| 能力 | 说明 |
|------|------|
| Tools | 可执行的功能（如搜索、计算） |
| Resources | 可读取的数据（如文件、数据库） |
| Prompts | 预定义的提示词模板 |
| Sampling | 让服务器请求 LLM 完成 |

## 实践要点

### 安装 MCP

```bash
# Python SDK
pip install mcp

# 或使用 uvx（推荐）
uvx mcp
```

### 创建 MCP Server

{/* TODO: 补充完整的 MCP Server 示例 */}

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# 创建服务器
server = Server("my-tools")

# 定义工具
@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_weather",
            description="获取指定城市的天气",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称"}
                },
                "required": ["city"]
            }
        )
    ]

# 实现工具
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_weather":
        city = arguments["city"]
        # 实际实现...
        return [TextContent(type="text", text=f"{city}: 晴，25°C")]
    
    raise ValueError(f"Unknown tool: {name}")

# 运行
async def main():
    async with stdio_server() as (read, write):
        await server.run(read, write)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### 配置 Claude Desktop

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (Mac)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)

{
  "mcpServers": {
    "my-tools": {
      "command": "python",
      "args": ["path/to/my_mcp_server.py"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    }
  }
}
```

### 内置 MCP Server

```bash
# 文件系统访问
npx @modelcontextprotocol/server-filesystem /path/to/directory

# GitHub 集成
npx @modelcontextprotocol/server-github

# PostgreSQL 数据库
npx @modelcontextprotocol/server-postgres postgresql://user:pass@localhost/db

# Google Drive
npx @modelcontextprotocol/server-gdrive
```

### 资源（Resources）

```python
from mcp.types import Resource, TextResourceContents

@server.list_resources()
async def list_resources():
    return [
        Resource(
            uri="file:///docs/readme.md",
            name="README",
            mimeType="text/markdown"
        )
    ]

@server.read_resource()
async def read_resource(uri: str):
    if uri == "file:///docs/readme.md":
        content = open("docs/readme.md").read()
        return TextResourceContents(
            uri=uri,
            mimeType="text/markdown",
            text=content
        )
```

### 提示词模板（Prompts）

```python
from mcp.types import Prompt, PromptArgument

@server.list_prompts()
async def list_prompts():
    return [
        Prompt(
            name="code_review",
            description="代码审查提示词",
            arguments=[
                PromptArgument(name="code", description="要审查的代码")
            ]
        )
    ]

@server.get_prompt()
async def get_prompt(name: str, arguments: dict):
    if name == "code_review":
        return f"""
        请审查以下代码，关注：
        1. 代码质量
        2. 潜在 Bug
        3. 性能问题
        
        代码：
        {arguments['code']}
        """
```

## 常见问题

### Q: MCP 和 Function Calling 有什么关系？

MCP 是工具发现和管理的协议，Function Calling 是具体的调用机制。MCP Server 提供的工具，最终通过 Function Calling 被调用。

### Q: 哪些应用支持 MCP？

- Claude Desktop（原生支持）
- 其他应用可通过 MCP SDK 集成

### Q: MCP Server 可以远程部署吗？

目前主要支持本地 stdio，HTTP 传输层在开发中。远程部署需要自行封装。

### Q: 如何调试 MCP Server？

```python
# 启用日志
import logging
logging.basicConfig(level=logging.DEBUG)

# 或使用 MCP Inspector
npx @modelcontextprotocol/inspector your-server
```

## 学习资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [MCP Servers 仓库](https://github.com/modelcontextprotocol/servers)

---

{/* TODO: 补充实际 MCP Server 开发案例 */}
