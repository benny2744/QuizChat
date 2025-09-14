
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Lightbulb,
  Brain,
  Target,
  Clock,
  AlertCircle
} from 'lucide-react';
import { ChatMessage } from '@/lib/types';

interface StudentChatProps {
  sessionId: string;
  studentName: string;
  sessionInfo: {
    topic: string;
    gradeLevel: string;
    sessionType: string;
  };
}

export function StudentChat({ sessionId, studentName, sessionInfo }: StudentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<string>('Basic');
  const [isConnected, setIsConnected] = useState(true);
  const [hasMasteredTopic, setHasMasteredTopic] = useState(false);
  const [advancedQuestionsAnswered, setAdvancedQuestionsAnswered] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Send welcome message when chat loads
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${studentName}! 👋 Welcome to your ${sessionInfo.topic} session. I'm your AI learning assistant, and I'm here to help you explore business concepts through interactive questions and scenarios.\n\nWe'll start with some basic questions and gradually increase the difficulty based on your responses. Are you ready to begin your learning journey?`,
      timestamp: new Date(),
      questionLevel: 'Basic'
    };
    setMessages([welcomeMessage]);
  }, [studentName, sessionInfo.topic]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      questionLevel: currentLevel
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentName,
          message: inputMessage.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        questionLevel: data.questionLevel || currentLevel
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update current level if it changed
      if (data.questionLevel && data.questionLevel !== currentLevel) {
        setCurrentLevel(data.questionLevel);
      }
      
      // Update mastery status
      if (data.hasMasteredTopic !== undefined) {
        setHasMasteredTopic(data.hasMasteredTopic);
      }
      
      if (data.advancedQuestionsAnswered !== undefined) {
        setAdvancedQuestionsAnswered(data.advancedQuestionsAnswered);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'I apologize, but I encountered an issue processing your message. Please try again, or let your teacher know if the problem persists.',
        timestamp: new Date(),
        questionLevel: currentLevel
      }]);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName })
      });

      if (response.ok) {
        // Redirect to success page or show success message
        window.location.href = '/student';
      }
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Basic': return <Lightbulb className="h-4 w-4" />;
      case 'Scenario': return <Brain className="h-4 w-4" />;
      case 'Advanced': return <Target className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Basic': return 'bg-green-100 text-green-800';
      case 'Scenario': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-h-[600px]">
      {/* Chat Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <span>Learning Chat</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={getLevelColor(currentLevel)}>
                {getLevelIcon(currentLevel)}
                <span className="ml-1">{currentLevel} Level</span>
              </Badge>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Connection Warning */}
      {!isConnected && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Connection issue detected. Please refresh the page if problems persist.
          </AlertDescription>
        </Alert>
      )}

      {/* Mastery Achievement Alert */}
      {hasMasteredTopic && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Target className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Congratulations! 🎉</strong> You've mastered the topic by answering {advancedQuestionsAnswered} advanced questions correctly.
                <br />
                <span className="text-sm">You can now leave the session as you've demonstrated excellent understanding.</span>
              </div>
              <Button 
                onClick={handleLeaveSession}
                className="ml-4 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                Leave Session
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`p-2 rounded-full ${
                message.role === 'user' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 text-white'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div className={`flex-1 max-w-[70%] ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                
                <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <Clock className="h-3 w-3" />
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.questionLevel && (
                    <>
                      <span>•</span>
                      <span>{message.questionLevel}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-full bg-blue-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-gray-600 text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={hasMasteredTopic ? "You've mastered the topic! Please use the 'Leave Session' button above." : "Type your response or ask a question..."}
              disabled={isLoading || hasMasteredTopic}
              className="flex-1"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim() || hasMasteredTopic}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>Press Enter to send • Max 500 characters</span>
            <span>{inputMessage.length}/500</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
