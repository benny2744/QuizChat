
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StudentChat } from './student-chat';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  BookOpen, 
  AlertCircle,
  Home,
  ArrowRight
} from 'lucide-react';
import { validateSessionCode } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface SessionInfo {
  id: string;
  topic: string;
  gradeLevel: string;
  sessionType: string;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
}

export function StudentInterface() {
  const { toast } = useToast();
  const [step, setStep] = useState<'entry' | 'chat'>('entry');
  const [studentName, setStudentName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionTimer, setSessionTimer] = useState('00:00');

  useEffect(() => {
    if (sessionInfo?.startTime && step === 'chat') {
      const interval = setInterval(() => {
        const startTime = new Date(sessionInfo.startTime!);
        const now = new Date();
        const diffMs = now.getTime() - startTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        setSessionTimer(`${diffMins}:${diffSecs.toString().padStart(2, '0')}`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionInfo, step]);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    if (!validateSessionCode(sessionCode.toUpperCase())) {
      setError('Invalid session code format. Please enter a 6-character code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if session exists and is active
      const sessionResponse = await fetch(`/api/sessions/by-code/${sessionCode.toUpperCase()}`);
      
      if (!sessionResponse.ok) {
        if (sessionResponse.status === 404) {
          throw new Error('Session not found. Please check your session code.');
        }
        throw new Error('Failed to find session');
      }

      const session = await sessionResponse.json();
      
      if (!session.isActive) {
        throw new Error('This session is not currently active. Please contact your teacher.');
      }

      // Join the session
      const joinResponse = await fetch(`/api/sessions/${session.id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: studentName.trim() })
      });

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        throw new Error(errorData.error || 'Failed to join session');
      }

      setSessionInfo(session);
      setStep('chat');
      
      toast({
        title: "Successfully Joined!",
        description: `Welcome to ${session.topic}. You can now start your learning session.`
      });

    } catch (error) {
      console.error('Error joining session:', error);
      setError(error instanceof Error ? error.message : 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSession = () => {
    if (confirm('Are you sure you want to leave this session? Your progress will be saved.')) {
      setStep('entry');
      setSessionInfo(null);
      setStudentName('');
      setSessionCode('');
      setError('');
    }
  };

  if (step === 'chat' && sessionInfo) {
    return (
      <>
        {/* Session Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 text-white p-2 rounded-lg">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{sessionInfo.topic}</h1>
                  <p className="text-sm text-gray-600">{sessionInfo.gradeLevel} • {sessionInfo.sessionType}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">{sessionTimer}</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {studentName}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleLeaveSession}>
                  Leave Session
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <StudentChat 
            sessionId={sessionInfo.id}
            studentName={studentName}
            sessionInfo={sessionInfo}
          />
        </main>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 text-white p-2 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-600">Join Your Learning Session</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Join Your <span className="text-green-600">Learning Session</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter your name and session code to start your interactive educational experience.
            Your teacher will provide the 6-character session code.
          </p>
        </div>

        {/* Entry Form */}
        <Card className="max-w-md mx-auto bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="bg-green-100 text-green-600 p-3 rounded-lg w-fit mx-auto mb-4">
              <BookOpen className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl">Session Entry</CardTitle>
            <CardDescription>
              Ready to learn? Let's get you connected!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinSession} className="space-y-6">
              <div>
                <Label htmlFor="studentName" className="text-base font-medium">
                  Your Name *
                </Label>
                <Input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1 h-12 text-base"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  This will identify you in the session
                </p>
              </div>

              <div>
                <Label htmlFor="sessionCode" className="text-base font-medium">
                  Session Code *
                </Label>
                <Input
                  id="sessionCode"
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="mt-1 h-12 text-base font-mono tracking-wider text-center"
                  maxLength={6}
                  style={{ textTransform: 'uppercase' }}
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  6-character code provided by your teacher
                </p>
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  'Joining Session...'
                ) : (
                  <>
                    Join Session
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="text-center pb-3">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold">1</span>
              </div>
              <CardTitle className="text-lg">Get Your Code</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Your teacher will share a 6-character session code with the class
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="text-center pb-3">
              <div className="bg-green-100 text-green-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold">2</span>
              </div>
              <CardTitle className="text-lg">Enter Details</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Fill in your name and the session code to join instantly
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="text-center pb-3">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold">3</span>
              </div>
              <CardTitle className="text-lg">Start Learning</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Engage with the AI tutor through questions and scenarios
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <div className="mt-12 bg-blue-50/70 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
              <span>Make sure you have a stable internet connection</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
              <span>Sessions typically last 5-10 minutes</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
              <span>Participate actively for the best learning experience</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
              <span>Your progress is automatically saved</span>
            </li>
          </ul>
        </div>
      </main>
    </>
  );
}
