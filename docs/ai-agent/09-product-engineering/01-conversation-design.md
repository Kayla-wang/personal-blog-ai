---
title: 对话流设计
sidebar_position: 1
tags: [对话设计, UX, 产品]
---

# 对话流设计

> 设计自然、高效的人机对话体验

## 概述

好的对话设计让用户感觉自然、高效，坏的设计让用户困惑、沮丧。对话流设计是 AI 产品成功的关键。

## 核心概念

### 1. 对话设计要素

| 要素 | 说明 |
|------|------|
| 开场 | 如何打招呼、建立期望 |
| 引导 | 如何帮助用户表达需求 |
| 确认 | 如何验证理解正确 |
| 反馈 | 如何告知处理进度 |
| 收尾 | 如何优雅结束 |

### 2. 对话类型

```
任务型对话：完成特定任务（查询、预订）
├── 槽位填充：收集必要信息
├── 确认执行：确认后执行
└── 结果反馈：告知结果

开放式对话：自由交流（问答、闲聊）
├── 意图理解：理解用户目的
├── 信息获取：必要时追问
└── 回复生成：提供有价值的回答
```

## 实践要点

### 开场设计

```python
# ❌ 不好的开场
"你好，我是AI助手，我可以回答各种问题，帮助你完成各种任务..."

# ✅ 好的开场
"你好！我可以帮你查资料、写代码、分析数据。有什么需要？"

# 上下文感知开场
def get_greeting(context: dict) -> str:
    if context.get("returning_user"):
        return f"欢迎回来！上次我们聊到 {context['last_topic']}，要继续吗？"
    if context.get("time_of_day") == "morning":
        return "早上好！今天想做什么？"
    return "你好！有什么可以帮你的？"
```

### 意图识别与引导

{/* TODO: 补充多轮意图澄清示例 */}

```python
# 处理模糊意图
CLARIFICATION_PROMPTS = {
    "ambiguous": "你是想 {option_a} 还是 {option_b}？",
    "incomplete": "好的，还需要知道 {missing_info}",
    "out_of_scope": "抱歉，这个我帮不了。但我可以 {alternatives}"
}

async def handle_ambiguous_intent(user_input: str) -> str:
    intent = analyze_intent(user_input)
    
    if intent.confidence < 0.7:
        # 主动澄清
        return f"你是想{intent.candidates[0]}，还是{intent.candidates[1]}？"
    
    if intent.missing_slots:
        # 追问必要信息
        return f"好的，请告诉我{intent.missing_slots[0]}"
    
    return await process_intent(intent)
```

### 多轮对话管理

```python
from enum import Enum
from typing import Optional

class ConversationState(Enum):
    GREETING = "greeting"
    COLLECTING_INFO = "collecting_info"
    CONFIRMING = "confirming"
    EXECUTING = "executing"
    COMPLETED = "completed"

class ConversationManager:
    def __init__(self):
        self.state = ConversationState.GREETING
        self.collected_info = {}
        self.required_fields = []
    
    def process(self, user_input: str) -> str:
        if self.state == ConversationState.GREETING:
            intent = self.detect_intent(user_input)
            self.required_fields = self.get_required_fields(intent)
            self.state = ConversationState.COLLECTING_INFO
            return self.ask_next_field()
        
        elif self.state == ConversationState.COLLECTING_INFO:
            self.extract_and_store(user_input)
            
            if self.all_fields_collected():
                self.state = ConversationState.CONFIRMING
                return self.confirm_message()
            else:
                return self.ask_next_field()
        
        elif self.state == ConversationState.CONFIRMING:
            if self.is_confirmation(user_input):
                self.state = ConversationState.EXECUTING
                result = self.execute()
                self.state = ConversationState.COMPLETED
                return f"完成！{result}"
            else:
                self.state = ConversationState.COLLECTING_INFO
                return "好的，需要修改什么？"
        
        return "有什么其他需要帮助的吗？"
```

### 错误恢复

```python
def handle_error(error_type: str, context: dict) -> str:
    """优雅地处理错误"""
    
    responses = {
        "not_understood": [
            "抱歉，我没太理解。你能换个说法吗？",
            "我有点困惑，你是想说{closest_match}吗？"
        ],
        "missing_info": [
            "还需要一些信息：{missing}",
            "差一点！请告诉我{missing}"
        ],
        "system_error": [
            "出了点问题，我重试一下...",
            "抱歉，系统暂时有问题。请稍后再试或换个方式描述"
        ],
        "out_of_capability": [
            "这个我做不了，但我可以帮你{alternative}",
            "抱歉，这超出了我的能力范围"
        ]
    }
    
    return random.choice(responses.get(error_type, responses["system_error"]))
```

### 对话个性化

```python
# 根据用户画像调整风格
def adjust_response_style(response: str, user_profile: dict) -> str:
    if user_profile.get("expertise") == "expert":
        # 专家：直接、技术性
        return response
    elif user_profile.get("expertise") == "beginner":
        # 新手：详细解释、避免术语
        return add_explanations(response)
    else:
        return response

# 记住用户偏好
def apply_preferences(response: str, preferences: dict) -> str:
    if preferences.get("concise"):
        return summarize(response)
    if preferences.get("formal"):
        return make_formal(response)
    return response
```

## 常见问题

### Q: 用户问了不相关的问题怎么办？

```python
def handle_off_topic(user_input: str, current_task: dict) -> str:
    if current_task:
        return f"我们正在处理{current_task['name']}，要先完成它，还是先回答这个问题？"
    else:
        return "这个问题我不太擅长，我主要能帮你{capabilities}。"
```

### Q: 如何避免对话死循环？

1. 设置最大追问次数
2. 提供退出选项
3. 主动提供帮助选项

```python
if clarification_count > 3:
    return "看起来我理解有困难。你可以：\n1. 换个说法\n2. 查看帮助\n3. 联系人工"
```

### Q: 如何设计多语言对话？

- 检测用户语言，自动切换
- 保持同一对话中语言一致
- 专业术语保持原文

## 学习资源

- [Google Conversation Design](https://developers.google.com/assistant/conversation-design)
- [对话设计最佳实践](https://www.voiceflow.com/blog/conversation-design)

---

{/* TODO: 补充实际产品的对话流设计 */}
