import { useState, useRef, useEffect } from 'react';
import { Send, Users, X, MessageSquare } from 'lucide-react';
import { useSyncPlayStore } from '../../../stores/syncPlayStore';
import { useAuthStore } from '../../../stores/authStore';
import styles from './SyncPlayChat.module.css';

export default function SyncPlayChat() {
  const { groupId, users, chatMessages, addChatMessage } = useSyncPlayStore();
  const userName = useAuthStore(s => s.userName);
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // 在真实的 SyncPlay 中，这里应该通过 WebSocket 发送消息给服务器
    // 我们目前模拟本地发送
    addChatMessage({
      senderName: userName || 'Me',
      text: inputText.trim(),
    });
    setInputText('');
  };

  if (!groupId) return null; // 未在房间中不显示

  if (!isOpen) {
    return (
      <button 
        className={styles['chat-toggle-btn']} 
        onClick={() => setIsOpen(true)}
        title="打开互动聊天"
      >
        <MessageSquare size={24} />
        {chatMessages.length > 0 && <span className={styles['badge']}>{chatMessages.length}</span>}
      </button>
    );
  }

  return (
    <div className={styles['chat-panel']}>
      <div className={styles['chat-header']}>
        <div className={styles['header-info']}>
          <Users size={16} />
          <span>放映室 ({users.length} 人在线)</span>
        </div>
        <button className={styles['close-btn']} onClick={() => setIsOpen(false)}>
          <X size={18} />
        </button>
      </div>

      <div className={styles['chat-messages']}>
        {chatMessages.length === 0 ? (
          <div className={styles['empty-msg']}>欢迎来到放映室！发送一条消息打个招呼吧。</div>
        ) : (
          chatMessages.map(msg => (
            <div 
              key={msg.id} 
              className={`${styles['msg-item']} ${msg.senderName === userName ? styles['msg-self'] : ''}`}
            >
              <div className={styles['msg-sender']}>{msg.senderName}</div>
              <div className={styles['msg-bubble']}>{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles['chat-input-area']} onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="发条弹幕..."
          className={styles['chat-input']}
        />
        <button type="submit" className={styles['send-btn']} disabled={!inputText.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
