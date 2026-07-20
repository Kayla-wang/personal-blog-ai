---
title: Python 语法基础与类型系统
sidebar_position: 1
tags: [Python, 类型系统, 基础]
---

# Python 语法基础与类型系统

> 面向前端开发者的 Python 快速入门

## 概述

作为前端开发者，你已经熟悉 JavaScript/TypeScript。Python 的语法更简洁，但有些关键差异需要注意。本文聚焦于 AI 开发中最常用的语法特性。

## 核心概念

### 1. 变量与类型

```python
# Python 是动态类型，但支持类型注解（类似 TypeScript）
name: str = "Agent"
count: int = 42
items: list[str] = ["a", "b", "c"]
config: dict[str, any] = {"model": "gpt-4", "temperature": 0.7}
```

**与 JS/TS 的对比**：
| 概念 | JavaScript/TypeScript | Python |
|------|----------------------|--------|
| 类型注解 | `let name: string` | `name: str` |
| 数组 | `string[]` | `list[str]` |
| 对象 | `Record<string, any>` | `dict[str, any]` |
| 空值 | `null / undefined` | `None` |

### 2. 类型注解与 Pydantic

{/* TODO: 补充 Pydantic 实践代码 */}

```python
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str
    content: str
    
# 自动验证类型
msg = ChatMessage(role="user", content="Hello")
```

**为什么重要**：Agent 开发中，Pydantic 用于：
- 定义 Tool 的输入输出 Schema
- 验证 LLM 的结构化输出
- API 请求/响应模型

### 3. 列表推导式

```python
# JS: items.map(x => x * 2).filter(x => x > 5)
# Python:
result = [x * 2 for x in items if x * 2 > 5]
```

### 4. 字典操作

```python
# 合并字典（类似 JS spread）
merged = {**dict1, **dict2}

# 解构赋值
config = {"model": "gpt-4", "temperature": 0.7}
model, temp = config["model"], config["temperature"]
```

### 5. 函数定义

```python
def chat(
    message: str,
    model: str = "gpt-4",
    *,  # 后面的参数必须用关键字传递
    temperature: float = 0.7,
) -> str:
    """与 LLM 对话"""
    pass
```

## 实践要点

### 常用于 Agent 开发的模式

```python
# 1. Optional 类型
from typing import Optional

def get_response(prompt: str, system: Optional[str] = None) -> str:
    pass

# 2. Union 类型（多种可能的类型）
from typing import Union

MessageContent = Union[str, list[dict]]

# 3. Literal 类型（限定值范围）
from typing import Literal

Role = Literal["user", "assistant", "system"]
```

## 常见问题

### Q: Python 的 None 和 JS 的 null/undefined 有什么区别？

Python 只有 `None`，表示"没有值"。判断时用 `is None`：

```python
if result is None:
    print("No result")
```

### Q: 如何处理可选参数？

```python
# 推荐：使用 None 作为默认值，而不是可变对象
def process(items: list[str] | None = None):
    items = items or []
```

## 学习资源

- [Python 官方教程](https://docs.python.org/3/tutorial/)
- [Pydantic 文档](https://docs.pydantic.dev/)
- [Python Type Hints Cheat Sheet](https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html)

---

{/* TODO: 补充个人实践代码和踩坑记录 */}
