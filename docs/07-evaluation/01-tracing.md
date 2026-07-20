---
title: LLM Tracing（LangSmith / Phoenix / Arize）
sidebar_position: 1
tags: [Tracing, LangSmith, 可观测性]
---

# LLM Tracing

> 追踪 LLM 调用，理解 Agent 行为

## 概述

LLM 应用是黑盒，Tracing 让你看到每次调用的输入、输出、延迟、Token 消耗，帮助调试和优化。

## 核心概念

### 1. 为什么需要 Tracing

```
问题：
- Agent 执行过程不可见
- 不知道 Token 花在哪里
- 难以定位错误原因
- 无法量化改进效果

Tracing 提供：
- 完整调用链路
- 每步输入输出
- 耗时和成本统计
- 错误详情
```

### 2. 主流工具

| 工具 | 特点 | 定价 |
|------|------|------|
| LangSmith | LangChain 官方，功能全 | 免费额度 + 付费 |
| Phoenix | 开源，可自托管 | 免费 |
| Arize | 企业级，ML 监控 | 付费 |
| Langfuse | 开源，支持多框架 | 免费 + 云服务 |

## 实践要点

### LangSmith 集成

```python
# 安装
# pip install langsmith

# 环境变量
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-api-key"
os.environ["LANGCHAIN_PROJECT"] = "my-project"

# 使用 LangChain 时自动追踪
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")
response = llm.invoke("Hello")  # 自动记录到 LangSmith
```

### 手动追踪

```python
from langsmith import traceable

@traceable(name="my_function")
def process_query(query: str) -> str:
    # 你的逻辑
    result = call_llm(query)
    return result

# 嵌套追踪
@traceable(name="agent_run")
def run_agent(task: str):
    plan = plan_task(task)  # 子 trace
    result = execute_plan(plan)  # 子 trace
    return result
```

### Phoenix（开源方案）

{/* TODO: 补充 Phoenix 完整配置 */}

```python
# 安装
# pip install arize-phoenix openinference-instrumentation-openai

import phoenix as px
from openinference.instrumentation.openai import OpenAIInstrumentor

# 启动 Phoenix
session = px.launch_app()

# 自动追踪 OpenAI 调用
OpenAIInstrumentor().instrument()

# 正常使用 OpenAI
from openai import OpenAI
client = OpenAI()
response = client.chat.completions.create(...)

# 查看: http://localhost:6006
```

### Langfuse

```python
# 安装
# pip install langfuse

from langfuse import Langfuse
from langfuse.decorators import observe

langfuse = Langfuse(
    public_key="pk-xxx",
    secret_key="sk-xxx",
    host="https://cloud.langfuse.com"
)

@observe()
def my_llm_call(prompt: str):
    response = call_openai(prompt)
    return response

# 或手动追踪
trace = langfuse.trace(name="my-trace")
span = trace.span(name="llm-call")
# ... 执行 LLM 调用
span.end(output={"response": response})
```

### 关键指标追踪

```python
# 追踪关键指标
@traceable(name="rag_query")
def rag_query(question: str) -> dict:
    start = time.time()
    
    # 检索
    docs = retriever.search(question)
    retrieval_time = time.time() - start
    
    # 生成
    gen_start = time.time()
    answer = llm.invoke(build_prompt(question, docs))
    generation_time = time.time() - gen_start
    
    return {
        "answer": answer,
        "metrics": {
            "retrieval_time": retrieval_time,
            "generation_time": generation_time,
            "docs_retrieved": len(docs),
            "total_time": time.time() - start
        }
    }
```

## 常见问题

### Q: Tracing 会影响性能吗？

影响很小（毫秒级），因为是异步上报。生产环境建议：
- 采样追踪（不是每次都记录）
- 只追踪关键路径

### Q: 敏感数据怎么处理？

```python
# LangSmith 支持数据脱敏
os.environ["LANGCHAIN_HIDE_INPUTS"] = "true"
os.environ["LANGCHAIN_HIDE_OUTPUTS"] = "true"

# 或自定义过滤
@traceable(name="chat", hide_inputs=True)
def chat(message: str):
    pass
```

### Q: 如何对比不同版本？

LangSmith 支持实验（Experiments）功能：
1. 准备测试数据集
2. 运行不同版本
3. 对比指标

## 学习资源

- [LangSmith 文档](https://docs.smith.langchain.com/)
- [Phoenix 文档](https://docs.arize.com/phoenix)
- [Langfuse 文档](https://langfuse.com/docs)

---

{/* TODO: 补充实际项目的 Tracing 配置 */}
