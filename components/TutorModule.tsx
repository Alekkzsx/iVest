import React, { useState, useRef, useEffect } from 'react';
import { createTutorChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, Bot, User, Eraser, Loader2 } from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';

const TutorModule: React.FC = () => {
  const chatSession = useRef<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Sou o VestiBot. Em que matéria posso te ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSession.current) {
      chatSession.current = createTutorChat();
    }
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !chatSession.current) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const result = await chatSession.current.sendMessageStream({
          message: userMsg
      });

      let fullText = "";
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result) {
          const responseChunk = chunk as GenerateContentResponse;
          const chunkText = responseChunk.text;
          if (chunkText) {
            fullText += chunkText;
            setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1] = { role: 'model', text: fullText };
                return newArr;
            });
          }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Desculpe, tive um problema ao processar sua mensagem. Tente novamente." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([{ role: 'model', text: 'Olá! Sou o VestiBot. Em que matéria posso te ajudar hoje?' }]);
    chatSession.current = createTutorChat(); // Reset chat session context
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 max-w-5xl mx-auto shadow-xl border-x border-gray-200">
      {/* Chat Header */}
      <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Tutor Virtual</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
            </p>
          </div>
        </div>
        <button 
          onClick={handleClear}
          className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
          title="Limpar conversa"
        >
          <Eraser size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                  isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>
                
                <div className={`p-4 rounded-2xl shadow-sm ${
                  isUser 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                }`}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800">
                       <ReactMarkdown>{msg.text}</ReactMarkdown>
                       {msg.text === '' && isTyping && idx === messages.length - 1 && (
                         <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1 align-middle"></span>
                       )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida aqui..."
            disabled={isTyping}
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-12"
          >
            {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          O VestiBot pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  );
};

export default TutorModule;