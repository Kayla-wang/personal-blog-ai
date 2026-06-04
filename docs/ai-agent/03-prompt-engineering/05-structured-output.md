---
title: 结构化输出（JSON Schema / Pydantic）
sidebar_position: 5
tags: [Prompt, JSON, Pydantic, 结构化输出]
---

# 结构化输出

> 让 LLM 输出可靠的、可解析的数据

## 概述

Agent 开发中，我们经常需要 LLM 输出结构化数据（JSON），而不是自由文本。本文介绍如何可靠地获取结构化输出。

## 核心概念

### 1. 为什么需要结构化输出

```python
# ❌ 自由文本输出 - 难以解析
response = "用户想要查询北京的天气，情感是正面的，置信度大约 85%"

# ✅ 结构化输出 - 直接使用
response = {
    "intent": "weather_query",
    "city": "北京",
    "sentiment": "positive",
    "confidence": 0.85
}
```

### 2. 实现方式对比

| 方式 | 可靠性 | 复杂度 | 适用场景 |
|------|--------|--------|----------|
| Prompt 约束 | 低 | 低 | 简单任务 |
| JSON Mode | 中 | 低 | 通用 JSON |
| Function Calling | 高 | 中 | 工具调用 |
| Structured Output | 最高 | 中 | 复杂 Schema |

### 3. 各方式示例

```python
# 方式 1: Prompt 约束
prompt = """
提取信息，输出 JSON 格式：
{"name": "姓名", "age": 数字}

输入：小明今年 25 岁
"""

# 方式 2: JSON Mode（OpenAI）
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    response_format={"type": "json_object"}
)

# 方式 3: Structured Output（OpenAI 最新）
from pydantic import BaseModel

class UserInfo(BaseModel):
    name: str
    age: int

response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[...],
    response_format=UserInfo
)
user = response.choices[0].message.parsed  # 直接是 UserInfo 对象
```

## 实践要点

### Pydantic 定义 Schema

{/* TODO: 补充复杂 Schema 示例 */}

```python
from pydantic import BaseModel, Field
from typing import Literal, Optional
from enum import Enum

class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class ExtractedInfo(BaseModel):
    """从用户输入中提取的信息"""
    
    intent: str = Field(description="用户意图")
    entities: list[str] = Field(default=[], description="提取的实体")
    sentiment: Sentiment = Field(description="情感倾向")
    confidence: float = Field(ge=0, le=1, description="置信度 0-1")
    
# 转换为 JSON Schema
schema = ExtractedInfo.model_json_schema()
```

### LangChain 结构化输出

```python
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import JsonOutputParser

# 方式 1: JsonOutputParser
parser = JsonOutputParser(pydantic_object=ExtractedInfo)

chain = prompt | llm | parser
result = chain.invoke({"input": "用户输入"})  # 返回 dict

# 方式 2: with_structured_output（推荐）
llm = ChatOpenAI(model="gpt-4o")
structured_llm = llm.with_structured_output(ExtractedInfo)

result = structured_llm.invoke("分析这段文本")  # 返回 ExtractedInfo 对象
```

### 错误处理

```python
from pydantic import ValidationError

async def safe_parse(response: str, schema: type[BaseModel]):
    """安全解析，处理错误"""
    try:
        # 尝试解析 JSON
        data = json.loads(response)
        # 验证 Schema
        return schema.model_validate(data)
    except json.JSONDecodeError:
        # JSON 格式错误，尝试修复
        return await retry_with_fix(response, schema)
    except ValidationError as e:
        # Schema 验证失败
        print(f"验证错误: {e}")
        return None
```

### 复杂 Schema 设计

```python
from typing import Union

class SearchAction(BaseModel):
    action: Literal["search"] = "search"
    query: str

class CalculateAction(BaseModel):
    action: Literal["calculate"] = "calculate"
    expression: str

class FinishAction(BaseModel):
    action: Literal["finish"] = "finish"
    answer: str

# Union 类型，模型选择其一
AgentAction = Union[SearchAction, CalculateAction, FinishAction]

class AgentResponse(BaseModel):
    thought: str
    action: AgentAction
```

## 常见问题

### Q: JSON Mode 和 Structured Output 有什么区别？

- **JSON Mode**：保证输出是合法 JSON，但不保证符合特定 Schema
- **Structured Output**：保证输出符合指定的 JSON Schema

### Q: 模型不遵守 Schema 怎么办？

1. 使用 `with_structured_output`（内置重试）
2. 手动重试 + 错误反馈
3. 简化 Schema，减少可选字段

### Q: 如何处理可选字段？

```python
class Info(BaseModel):
    required_field: str
    optional_field: Optional[str] = None
    with_default: str = "default_value"
```

## 学习资源

- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Pydantic 文档](https://docs.pydantic.dev/)
- [LangChain Output Parsers](https://python.langchain.com/docs/modules/model_io/output_parsers)

---

{/* TODO: 补充复杂业务场景的 Schema 设计 */}
