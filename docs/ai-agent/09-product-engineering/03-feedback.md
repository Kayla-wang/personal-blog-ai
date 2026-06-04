---
title: 用户反馈收集
sidebar_position: 3
tags: [反馈, 用户体验, 产品]
---

# 用户反馈收集

> 从用户那里学习，持续改进 AI 应用

## 概述

用户反馈是改进 AI 应用的金矿。设计好的反馈机制，让用户愿意反馈，让数据有用。

## 核心概念

### 1. 反馈类型

| 类型 | 获取方式 | 信息量 |
|------|----------|--------|
| 显式反馈 | 点赞/踩、评分 | 明确但粗糙 |
| 隐式反馈 | 复制、重新提问 | 丰富但需推断 |
| 文字反馈 | 评论、建议 | 最丰富 |

### 2. 反馈时机

```
对话结束后 - 整体满意度
单条回复后 - 这条回答的质量
任务完成后 - 任务是否成功
定期调研 - 深度反馈
```

## 实践要点

### 基础反馈组件

```tsx
// React 反馈组件
function FeedbackButtons({ messageId }: { messageId: string }) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  
  const submitFeedback = async (type: 'up' | 'down') => {
    setFeedback(type);
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        messageId,
        type,
        timestamp: Date.now()
      })
    });
  };
  
  return (
    <div className="feedback-buttons">
      <button 
        onClick={() => submitFeedback('up')}
        className={feedback === 'up' ? 'selected' : ''}
      >
        👍
      </button>
      <button 
        onClick={() => submitFeedback('down')}
        className={feedback === 'down' ? 'selected' : ''}
      >
        👎
      </button>
    </div>
  );
}
```

### 后端反馈收集

{/* TODO: 补充完整的反馈分析流水线 */}

```python
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

class Feedback(BaseModel):
    message_id: str
    type: str  # "up", "down", "report"
    reason: str = None
    details: str = None

@app.post("/feedback")
async def submit_feedback(feedback: Feedback):
    # 存储反馈
    record = {
        **feedback.dict(),
        "timestamp": datetime.utcnow(),
        "user_id": get_current_user_id()
    }
    
    await save_feedback(record)
    
    # 负反馈触发告警
    if feedback.type == "down":
        await notify_team(f"收到负反馈: {feedback.message_id}")
    
    return {"status": "recorded"}
```

### 隐式反馈追踪

```python
# 追踪用户行为推断满意度
class ImplicitFeedbackTracker:
    def __init__(self):
        self.events = []
    
    def track_event(self, event_type: str, data: dict):
        self.events.append({
            "type": event_type,
            "data": data,
            "timestamp": datetime.utcnow()
        })
    
    def infer_satisfaction(self, conversation_id: str) -> float:
        """根据行为推断满意度"""
        events = self.get_conversation_events(conversation_id)
        
        signals = {
            "copy_response": 0.3,      # 复制回答 → 可能有用
            "regenerate": -0.2,        # 重新生成 → 不满意
            "edit_and_resend": -0.1,   # 修改后重发 → 有改进空间
            "task_completed": 0.5,     # 完成任务 → 满意
            "abandoned": -0.4,         # 中途离开 → 不满意
        }
        
        score = 0.5  # 基准分
        for event in events:
            score += signals.get(event["type"], 0)
        
        return max(0, min(1, score))
```

### 反馈原因收集

```tsx
// 负反馈时收集原因
function NegativeFeedbackModal({ onSubmit, onClose }) {
  const reasons = [
    { id: 'incorrect', label: '答案不正确' },
    { id: 'incomplete', label: '答案不完整' },
    { id: 'irrelevant', label: '没有回答问题' },
    { id: 'too_long', label: '回答太长' },
    { id: 'confusing', label: '表达不清楚' },
    { id: 'other', label: '其他' }
  ];
  
  const [selected, setSelected] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  
  return (
    <div className="modal">
      <h3>告诉我们哪里需要改进</h3>
      
      {reasons.map(r => (
        <label key={r.id}>
          <input
            type="checkbox"
            checked={selected.includes(r.id)}
            onChange={() => toggleReason(r.id)}
          />
          {r.label}
        </label>
      ))}
      
      <textarea
        placeholder="更多细节（可选）"
        value={details}
        onChange={e => setDetails(e.target.value)}
      />
      
      <button onClick={() => onSubmit({ reasons: selected, details })}>
        提交
      </button>
    </div>
  );
}
```

### 反馈数据分析

```python
def analyze_feedback(time_range: str = "7d") -> dict:
    """分析反馈数据"""
    feedbacks = get_feedbacks(time_range)
    
    # 基础统计
    total = len(feedbacks)
    positive = sum(1 for f in feedbacks if f["type"] == "up")
    negative = sum(1 for f in feedbacks if f["type"] == "down")
    
    # 负反馈原因分布
    negative_reasons = {}
    for f in feedbacks:
        if f["type"] == "down" and f.get("reason"):
            negative_reasons[f["reason"]] = negative_reasons.get(f["reason"], 0) + 1
    
    # 按功能/场景分组
    by_feature = group_by(feedbacks, "feature")
    feature_scores = {
        feature: sum(1 for f in items if f["type"] == "up") / len(items)
        for feature, items in by_feature.items()
    }
    
    return {
        "satisfaction_rate": positive / total if total else 0,
        "total_feedback": total,
        "negative_reasons": negative_reasons,
        "feature_scores": feature_scores
    }
```

### 反馈驱动改进

```python
# 将负反馈转化为改进 Case
async def process_negative_feedback(feedback: Feedback):
    # 获取原始对话
    conversation = await get_conversation(feedback.message_id)
    
    # 创建改进 Case
    improvement_case = {
        "question": conversation["user_message"],
        "bad_answer": conversation["assistant_message"],
        "feedback_reason": feedback.reason,
        "feedback_details": feedback.details,
        "status": "pending_review"
    }
    
    await save_improvement_case(improvement_case)
    
    # 定期汇总成训练数据或 Prompt 改进点
```

## 常见问题

### Q: 用户不愿意反馈怎么办？

1. 简化反馈（一键点赞/踩）
2. 在关键时刻请求反馈
3. 提供激励（积分、功能解锁）
4. 依赖隐式反馈

### Q: 如何处理大量反馈？

1. 自动分类和聚类
2. 优先处理高频问题
3. 使用 LLM 辅助分析

### Q: 反馈数据如何用于改进？

1. **Prompt 优化**：根据负反馈调整指令
2. **RAG 改进**：补充缺失的知识
3. **模型微调**：积累训练数据
4. **产品迭代**：改进交互流程

## 学习资源

- [用户反馈系统设计](https://www.nngroup.com/articles/user-feedback/)
- [RLHF 原理](https://huggingface.co/blog/rlhf)

---

{/* TODO: 补充反馈驱动的产品迭代案例 */}
