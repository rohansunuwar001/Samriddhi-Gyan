import React, { useState } from 'react';
import axios from 'axios';
import { Send, Bot, Loader2, Sparkles, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const AIAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);

  const showNotification = (title, message, isError = false) => {
    if (window.Notification && Notification.permission === "granted") {
      new Notification(title, { body: message });
    } else {
      alert(`${title}: ${message}`); // Fallback for browsers without Notification support
    }
  };

  const askAI = async () => {
    if (!prompt.trim()) {
      showNotification('Empty Prompt', 'Please enter a question to ask the AI assistant', true);
      return;
    }

    setLoading(true);
    const userQuestion = prompt;
    setPrompt('');
    
    try {
      // Add user question to conversation
      setConversation(prev => [...prev, { role: 'user', content: userQuestion }]);
      
      const res = await axios.post('http://localhost:7777/api/ai/ask', {
        prompt: userQuestion,
      });
      
      const aiResponse = res.data.answer;
      setResponse(aiResponse);
      // Add AI response to conversation
      setConversation(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      console.error(err);
      showNotification('Error', 'Failed to get response from AI assistant', true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification('Copied!', 'Response copied to clipboard');
      })
      .catch(() => {
        showNotification('Error', 'Failed to copy text', true);
      });
  };

  const clearConversation = () => {
    setConversation([]);
    setResponse('');
    showNotification('Cleared', 'Conversation history cleared');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

  // Request notification permission when component mounts
  React.useEffect(() => {
    if (window.Notification && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 p-4 text-white">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6" />
            <h2 className="text-xl font-bold">AI Course Assistant</h2>
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="h-4 w-4 mr-1" />
              Powered by Gemini
            </Badge>
          </div>
        </div>

        {/* Conversation History */}
        <div className="p-4 h-[400px] overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Bot className="h-12 w-12 mb-4" />
              <p className="text-lg">How can I help with your course today?</p>
              <p className="text-sm mt-2">Ask about concepts, assignments, or learning strategies</p>
            </div>
          ) : (
            <div className="space-y-6">
              {conversation.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {msg.role === 'assistant' && (
                        <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                      <span className="text-xs font-medium">
                        {msg.role === 'user' ? 'You' : 'Course Assistant'}
                      </span>
                      {msg.role === 'assistant' && (
                        <button 
                          onClick={() => copyToClipboard(msg.content)}
                          className="ml-auto text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="relative">
            <Label htmlFor="prompt" className="sr-only">Ask a question</Label>
            <Textarea
              id="prompt"
              placeholder="Ask me anything about your course..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-12 min-h-[100px]"
              disabled={loading}
            />
            <div className="absolute right-2 bottom-2 flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearConversation}
                disabled={conversation.length === 0}
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                onClick={askAI}
                disabled={loading || !prompt.trim()}
                title="Send message"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Press Shift+Enter for new line. Just Enter to send.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;