import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import styles from './styles.module.css';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles.container}>
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <span>AI 助手</span>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="关闭"
            >
              ×
            </button>
          </div>

          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.welcome}>
                你好！有什么可以帮助你的吗？
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                }`}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <span className={styles.typing}>思考中...</span>
              </div>
            )}
            {error && (
              <div className={styles.error}>
                发生错误，请重试
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="输入消息..."
              className={styles.input}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={isLoading || !input.trim()}
            >
              发送
            </button>
          </form>
        </div>
      )}

      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? '关闭聊天' : '打开聊天'}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  );
}
