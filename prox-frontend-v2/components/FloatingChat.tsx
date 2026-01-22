'use client';

import { useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  showModeButtons?: boolean;
  showAreaCards?: boolean;
  areas?: string[];
  products?: any[];
  showProductGrid?: boolean;
  solutions?: any[];
}

interface FloatingChatProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: Message[];
  onSend: (message: string) => void;
  context: {
    space?: string;
    challenge?: string;
    size?: string;
    style?: string;
    budget?: string;
  };
  input?: string;
  onInputChange?: (value: string) => void;
  isLoading?: boolean;
}

export default function FloatingChat({ 
  isOpen, 
  onToggle, 
  messages, 
  onSend, 
  context,
  input = '',
  onInputChange,
  isLoading = false
}: FloatingChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      if (onInputChange) {
        onInputChange('');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onInputChange) {
      onInputChange(e.target.value);
    }
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const contextSummary = Object.entries(context)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' • ');

  if (!isOpen) {
    // Floating button
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-oak-500 to-oak-600 hover:from-oak-600 hover:to-oak-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
      >
        <MessageCircle size={24} className="group-hover:scale-110 transition-transform duration-200" />
        
        {/* Notification badge if there are new messages */}
        {messages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  // Slide-over drawer
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onToggle}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slideInFromRight">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={18} className="text-oak-600" />
              <h3 className="font-medium text-gray-900">Chat</h3>
            </div>
            {contextSummary && (
              <p className="text-xs text-gray-500 truncate">{contextSummary}</p>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Continue the conversation here</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-oak-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-1">
                      P
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-oak-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-oak-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-1">
                    P
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg rounded-bl-sm">
                    <div className="flex items-center gap-1">
                      <div className="ai-loading-dot"></div>
                      <div className="ai-loading-dot"></div>
                      <div className="ai-loading-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={isLoading}
                placeholder="Continue the conversation..."
                className="w-full resize-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-oak-500 focus:ring-1 focus:ring-oak-500 disabled:opacity-50"
                rows={1}
                style={{ minHeight: '36px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 bg-oak-500 hover:bg-oak-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}