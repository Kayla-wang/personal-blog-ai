---
title: 国内合规部署（阿里百炼 / 腾讯混元 / 百度千帆）
sidebar_position: 5
tags: [LLM, 国内部署, 阿里云, 腾讯云, 百度]
---

# 国内合规部署

> 阿里百炼、腾讯混元、百度千帆使用指南

## 概述

在国内做 ToB 业务或处理敏感数据时，通常需要使用国内的大模型服务。本文介绍主流平台的接入方式。

## 核心概念

### 1. 主流平台对比

| 平台 | 主力模型 | 优势 | API 兼容性 |
|------|----------|------|------------|
| 阿里百炼 | Qwen-Max/Plus/Turbo | 模型多、生态全 | OpenAI 兼容 |
| 腾讯混元 | Hunyuan-Pro/Standard | 腾讯云集成 | OpenAI 兼容 |
| 百度千帆 | ERNIE-4/3.5 | 中文能力强 | 自有协议 |
| 字节火山 | Doubao-Pro | 性价比高 | OpenAI 兼容 |

### 2. 阿里百炼接入

{/* TODO: 补充完整的接入代码 */}

```python
from openai import OpenAI

# 阿里百炼兼容 OpenAI SDK
client = OpenAI(
    api_key="sk-xxx",  # 百炼 API Key
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

response = client.chat.completions.create(
    model="qwen-max",  # 或 qwen-plus, qwen-turbo
    messages=[
        {"role": "user", "content": "你好"}
    ]
)
```

**模型选择**：
- `qwen-max`：最强，适合复杂任务
- `qwen-plus`：平衡，日常使用
- `qwen-turbo`：快速便宜，简单任务

### 3. 腾讯混元接入

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="https://api.hunyuan.cloud.tencent.com/v1"
)

response = client.chat.completions.create(
    model="hunyuan-pro",
    messages=[
        {"role": "user", "content": "你好"}
    ]
)
```

### 4. 百度千帆接入

```python
import qianfan

# 百度有自己的 SDK
chat = qianfan.ChatCompletion()

response = chat.do(
    model="ERNIE-4.0",
    messages=[
        {"role": "user", "content": "你好"}
    ]
)
```

## 实践要点

### LangChain 集成

```python
# 阿里百炼
from langchain_community.chat_models import ChatTongyi

llm = ChatTongyi(
    model="qwen-max",
    dashscope_api_key="sk-xxx"
)

# 百度千帆
from langchain_community.chat_models import QianfanChatEndpoint

llm = QianfanChatEndpoint(
    model="ERNIE-4.0-8K",
    qianfan_ak="xxx",
    qianfan_sk="xxx"
)
```

### 统一接口封装

```python
class LLMClient:
    """统一的 LLM 客户端"""
    
    def __init__(self, provider: str):
        if provider == "aliyun":
            self.client = OpenAI(
                api_key=os.getenv("DASHSCOPE_API_KEY"),
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
            )
            self.model = "qwen-max"
        elif provider == "openai":
            self.client = OpenAI()
            self.model = "gpt-4o"
        # ... 其他提供商
    
    def chat(self, messages: list) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages
        )
        return response.choices[0].message.content
```

### 合规检查清单

- [ ] 数据是否需要留在国内？
- [ ] 是否需要备案？
- [ ] 是否需要内容审核？
- [ ] 用户协议是否覆盖 AI 生成内容？

## 常见问题

### Q: 国产模型和 GPT-4 差距大吗？

在中文场景下差距不大，某些任务甚至更好。英文/代码场景仍有差距。

### Q: 如何选择国内平台？

- **已有阿里云** → 百炼（生态集成方便）
- **已有腾讯云** → 混元
- **追求中文效果** → 百度千帆
- **追求性价比** → 字节火山

### Q: 国内模型支持 Function Calling 吗？

主流模型都支持，API 格式与 OpenAI 兼容或相似。

### Q: 延迟和稳定性如何？

国内访问延迟低（小于 100ms），稳定性各平台差异不大，建议实测。

## 学习资源

- [阿里百炼文档](https://help.aliyun.com/document_detail/2712195.html)
- [腾讯混元文档](https://cloud.tencent.com/document/product/1729)
- [百度千帆文档](https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html)

---

{/* TODO: 补充各平台的实际对比测试 */}
