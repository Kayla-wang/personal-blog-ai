---
title: Tool 设计
sidebar_position: 6
tags: [Agent, Tool, 工具设计]
---

# Tool 设计

> Schema 定义、错误处理、幂等性设计

## 概述

Tool（工具）是 Agent 的能力扩展。好的工具设计让 Agent 更容易正确使用，减少错误，提高效率。

## 核心概念

### 1. 工具三要素

| 要素 | 说明 | 重要性 |
|------|------|--------|
| 名称 | 简洁、动词短语 | 让 LLM 理解用途 |
| 描述 | 清晰说明功能和使用场景 | 决定 LLM 是否选择 |
| Schema | 参数定义和验证 | 确保输入正确 |

### 2. Schema 设计

```python
from langchain_core.tools import tool
from pydantic import BaseModel, Field

class SearchInput(BaseModel):
    query: str = Field(description="搜索关键词")
    max_results: int = Field(default=5, description="返回结果数量，1-10")
    filter_date: str | None = Field(default=None, description="日期过滤，格式 YYYY-MM-DD")

@tool(args_schema=SearchInput)
def search(query: str, max_results: int = 5, filter_date: str | None = None) -> str:
    """
    搜索互联网获取信息。
    
    使用场景：
    - 查询实时信息（新闻、天气、股票）
    - 获取最新知识
    - 验证事实
    
    不适合：
    - 数学计算（用 calculator）
    - 已知信息的整理
    """
    # 实现...
```

### 3. 工具分类

```
按功能：
├── 信息获取（search, read_file, query_database）
├── 数据处理（calculator, text_process, data_transform）
├── 外部操作（send_email, create_issue, call_api）
└── 控制流程（ask_human, delegate_task）

按风险：
├── 只读（低风险）
├── 写入（中风险）
└── 不可逆（高风险，需确认）
```

## 实践要点

### 好的工具描述

{/* TODO: 补充更多工具设计示例 */}

```python
# ✅ 好的描述
@tool
def get_stock_price(symbol: str) -> str:
    """
    获取股票的当前价格。
    
    参数：
        symbol: 股票代码，如 "AAPL"、"GOOGL"、"600519.SH"
    
    返回：
        包含当前价格、涨跌幅的描述
    
    示例：
        get_stock_price("AAPL") → "AAPL: $150.00 (+1.5%)"
    """

# ❌ 不好的描述
@tool
def stock(s: str) -> str:
    """获取股票"""
```

### 错误处理

```python
from langchain_core.tools import ToolException

@tool
def query_database(sql: str) -> str:
    """
    执行 SQL 查询。只支持 SELECT 语句。
    
    错误情况：
    - 语法错误：返回错误信息和建议修正
    - 权限不足：提示联系管理员
    - 超时：建议添加 LIMIT 或优化查询
    """
    try:
        # 安全检查
        if not sql.strip().upper().startswith("SELECT"):
            raise ToolException("只支持 SELECT 查询，请不要尝试修改数据")
        
        result = execute_sql(sql)
        return format_result(result)
        
    except TimeoutError:
        raise ToolException("查询超时，请添加 LIMIT 子句或简化查询条件")
    except PermissionError:
        raise ToolException("权限不足，请联系管理员")
    except Exception as e:
        raise ToolException(f"查询错误：{e}。请检查 SQL 语法")
```

### 幂等性设计

```python
import hashlib
import json

class IdempotentTool:
    """确保工具调用幂等（重复调用同样输入得到同样结果）"""
    
    def __init__(self):
        self.cache = {}
    
    def _get_cache_key(self, **kwargs) -> str:
        return hashlib.md5(json.dumps(kwargs, sort_keys=True).encode()).hexdigest()
    
    @tool
    def send_notification(self, user_id: str, message: str) -> str:
        """发送通知给用户（幂等）"""
        cache_key = self._get_cache_key(user_id=user_id, message=message)
        
        if cache_key in self.cache:
            return f"通知已发送过（缓存）"
        
        # 实际发送...
        self.cache[cache_key] = True
        return f"通知已发送给 {user_id}"
```

### 组合工具

```python
from langchain.tools import StructuredTool

# 将多个简单操作组合为一个工具
def create_and_send_report(topic: str, recipients: list[str]) -> str:
    """
    生成报告并发送给指定收件人。
    
    这是一个组合操作，包含：
    1. 收集数据
    2. 生成报告
    3. 发送邮件
    """
    data = collect_data(topic)
    report = generate_report(data)
    send_email(recipients, report)
    return f"报告已生成并发送给 {len(recipients)} 人"

report_tool = StructuredTool.from_function(
    func=create_and_send_report,
    name="create_and_send_report",
    description="生成并发送报告"
)
```

### 工具使用统计

```python
from functools import wraps
import time

def track_usage(func):
    """追踪工具使用情况"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start
            log_usage(func.__name__, "success", duration, args, kwargs)
            return result
        except Exception as e:
            duration = time.time() - start
            log_usage(func.__name__, "error", duration, args, kwargs, str(e))
            raise
    return wrapper

@tool
@track_usage
def my_tool(query: str) -> str:
    """我的工具"""
    pass
```

## 常见问题

### Q: 工具太多 Agent 选不对怎么办？

1. 减少工具数量（少于 10 个最佳）
2. 相似工具合并或分组
3. 在 System Prompt 中给出选择指导
4. 使用工具路由（先决定类别，再选具体工具）

### Q: 如何测试工具？

```python
# 单元测试
def test_search_tool():
    result = search("Python 教程", max_results=3)
    assert "Python" in result
    assert len(result) > 0

# 集成测试（Agent 是否正确使用）
def test_agent_uses_search():
    result = agent.invoke("搜索最新的 AI 新闻")
    # 检查是否调用了 search 工具
    assert "search" in agent.last_tool_calls
```

### Q: 工具返回值应该多详细？

- 足够 LLM 理解结果
- 不要太长（浪费 Token）
- 包含关键信息和状态
- 错误情况给出可操作的建议

## 学习资源

- [LangChain Tools](https://python.langchain.com/docs/modules/agents/tools)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

---

{/* TODO: 补充实际项目的工具库设计 */}
