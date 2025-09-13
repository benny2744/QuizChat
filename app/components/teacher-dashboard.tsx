
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionCreationForm } from './session-creation-form';
import { SessionManagement } from './session-management';
import { ParticipantTracking } from './participant-tracking';
import { ResultsDashboard } from './results-dashboard';
import { Plus, Users, BarChart3, Settings, Home } from 'lucide-react';
import { SessionData } from '@/lib/types';
import Link from 'next/link';

export function TeacherDashboard() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [activeSessions, setActiveSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions?includeStats=true');
      const data = await response.json();
      setSessions(data);
      setActiveSessions(data.filter((s: SessionData) => s.isActive));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-sm text-gray-600">Manage Educational Sessions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Active Sessions: <span className="font-semibold text-green-600">{activeSessions.length}</span>
              </div>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
              <p className="text-xs text-muted-foreground">
                Created this semester
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeSessions.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {activeSessions.reduce((acc, s) => acc + (s.participantCount || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Active now
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {sessions.filter(s => {
                  const today = new Date();
                  const sessionDate = new Date(s.createdAt);
                  return sessionDate.toDateString() === today.toDateString() && !s.isActive;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Sessions completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="sessions" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="sessions" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Manage Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Session</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Live Tracking</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Results</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Session Management</h2>
              <SessionManagement 
                sessions={sessions} 
                onSessionUpdate={fetchSessions} 
              />
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Create New Session</h2>
              <SessionCreationForm onSessionCreated={fetchSessions} />
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Real-time Participant Tracking</h2>
              <ParticipantTracking activeSessions={activeSessions} />
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6">Results Dashboard</h2>
              <ResultsDashboard sessions={sessions} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
