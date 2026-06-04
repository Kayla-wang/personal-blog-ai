---
title: Dify（可视化编排 / 低代码）
sidebar_position: 6
tags: [Agent, Dify, 低代码, 可视化]
---

# Dify

> 可视化 AI 应用开发平台

## 概述

Dify 是一个低代码 AI 应用开发平台，通过可视化界面构建 LLM 应用，无需大量编码。

## 核心概念

### 1. Dify 特点

```
优势：
- 可视化拖拽式编排
- 内置 RAG 能力
- 支持多种模型
- 快速部署
- 开源可自托管

适用场景：
- 快速原型验证
- 非技术团队使用
- 标准化的 AI 应用
```

### 2. 应用类型

| 类型 | 说明 | 场景 |
|------|------|------|
| 聊天助手 | 对话式应用 | 客服、问答 |
| Agent | 自主决策型 | 复杂任务 |
| 工作流 | 固定流程 | 数据处理 |
| 文本生成 | 单次生成 | 内容创作 |

### 3. 核心组件

```
Dify 架构：
├── Prompt 编排  # System Prompt 管理
├── 知识库       # RAG 文档管理
├── 工具         # 外部能力集成
├── 变量         # 动态参数
└── 工作流节点   # 可视化编排
```

## 实践要点

### 部署 Dify

```bash
# Docker 部署
git clone https://github.com/langgenius/dify.git
cd dify/docker
docker compose up -d

# 访问 http://localhost:3000
```

### 创建聊天助手

```yaml
# 基本配置
应用类型: 聊天助手
模型: gpt-4o
System Prompt: |
  你是一个专业的客服助手。
  - 友善、专业
  - 不知道就说不知道
  - 引导用户提供更多信息
```

### 配置知识库（RAG）

```yaml
# 知识库设置
1. 创建知识库
2. 上传文档（PDF/Word/TXT）
3. 配置切分策略：
   - 分段长度: 500
   - 重叠: 50
4. 选择 Embedding 模型
5. 在应用中引用知识库
```

### 添加工具

{/* TODO: 补充自定义工具开发 */}

```yaml
# 内置工具
- 网络搜索（Google/Bing）
- 计算器
- 天气查询
- HTTP 请求

# 自定义工具（API）
名称: 库存查询
URL: https://api.example.com/stock
方法: GET
参数:
  - product_id: string
```

### 工作流编排

```
工作流示例：客户咨询处理

[开始] → [意图识别] → [分支]
                         ├── 产品咨询 → [RAG 检索] → [生成回复]
                         ├── 订单查询 → [API 调用] → [格式化]
                         └── 投诉 → [转人工]
```

### API 调用

```python
import requests

# Dify API
url = "http://localhost:3000/v1/chat-messages"
headers = {
    "Authorization": "Bearer your-api-key",
    "Content-Type": "application/json"
}

data = {
    "inputs": {},
    "query": "用户问题",
    "user": "user-123",
    "response_mode": "streaming"  # 或 "blocking"
}

response = requests.post(url, headers=headers, json=data)
```

### 流式响应（SSE）

```python
import requests

def stream_chat(query: str):
    response = requests.post(
        "http://localhost:3000/v1/chat-messages",
        headers={"Authorization": "Bearer your-api-key"},
        json={"query": query, "response_mode": "streaming"},
        stream=True
    )
    
    for line in response.iter_lines():
        if line:
            print(line.decode())
```

## 常见问题

### Q: Dify 适合生产环境吗？

适合，但需要考虑：
- 高并发需要扩展部署
- 敏感场景需要私有化部署
- 复杂逻辑可能受限于可视化能力

### Q: 和 LangChain 怎么选？

| 场景 | 推荐 |
|------|------|
| 快速验证 | Dify |
| 非技术用户 | Dify |
| 复杂逻辑 | LangChain |
| 深度定制 | LangChain |
| 团队协作 | Dify（可视化更直观） |

### Q: 如何自定义更复杂的逻辑？

1. 使用 HTTP 工具调用外部 API
2. 开发自定义工具插件
3. 在工作流中组合多个节点

## 学习资源

- [Dify 官方文档](https://docs.dify.ai/)
- [Dify GitHub](https://github.com/langgenius/dify)

---

{/* TODO: 补充 Dify 生产部署配置 */}
