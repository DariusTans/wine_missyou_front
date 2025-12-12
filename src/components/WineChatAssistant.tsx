import React, { useState, useRef, useEffect } from 'react';
import { wineService } from '../services/langchainService';
import './WineChatAssistant.css';

interface WineData {
  wine_name: string;
  rating?: number;
  vintage?: number;
  producer?: string;
  region?: string;
  tasting_notes?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface WineChatAssistantProps {
  wineData: WineData;
}

const WineChatAssistant: React.FC<WineChatAssistantProps> = ({ wineData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage('user', userMessage);
    setIsLoading(true);

    // try {
    //   const response = await wineService.chatWithWineExpert(userMessage, wineData);
    //   addMessage('assistant', response);
    // } catch (error) {
    //   console.error('Chat error:', error);
    //   addMessage('assistant', "I'm sorry, I encountered an error. Please try again.");
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const suggestedQuestions = [
    "What food would pair well with this wine?",
    "How long can I cellar this wine?",
    "What's the best serving temperature?",
    "Tell me more about this wine region",
    "Should I decant this wine?"
  ];

  if (!isExpanded) {
    return (
      <div className="wine-chat-assistant collapsed">
        <button 
          className="chat-toggle-button"
          onClick={() => setIsExpanded(true)}
        >
          💬 Ask Wine Expert
        </button>
      </div>
    );
  }

  return (
    <div className="wine-chat-assistant">
      <div className="chat-header">
        <h3>💬 Wine Expert Chat</h3>
        <div className="chat-controls">
          <button onClick={clearChat} className="clear-chat-button" title="Clear chat">
            🗑️
          </button>
          <button 
            onClick={() => setIsExpanded(false)} 
            className="minimize-button"
            title="Minimize"
          >
            ➖
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="welcome-message">
              <h4>👋 Ask me anything about {wineData.wine_name}!</h4>
              <p>I'm here to help with wine questions, food pairings, serving tips, and more.</p>
            </div>
            <div className="suggested-questions">
              <p>Try asking:</p>
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  className="suggestion-button"
                  onClick={() => {
                    setInputMessage(question);
                    inputRef.current?.focus();
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.content}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant loading">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-section">
        <div className="chat-input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this wine..."
            disabled={isLoading}
            className="chat-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WineChatAssistant;