
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, FileText, Calendar, Users, Clock } from 'lucide-react';
import { SessionData } from '@/lib/types';
import { formatDate, getSessionStatus } from '@/lib/utils';

interface ResultsDashboardProps {
  sessions: SessionData[];
}

export function ResultsDashboard({ sessions }: ResultsDashboardProps) {
  const completedSessions = sessions.filter(s => !s.isActive && s.endTime);
  
  const handleDownloadResults = (sessionId: string, format: 'md' | 'csv') => {
    // Placeholder for Phase 3 implementation
    console.log(`Download ${format.toUpperCase()} for session ${sessionId}`);
  };

  const getSessionStats = (session: SessionData) => {
    // Placeholder calculations for Phase 3
    return {
      totalParticipants: session.participantCount || 0,
      averageScore: Math.floor(Math.random() * 40) + 60, // Mock data
      duration: session.startTime && session.endTime 
        ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
        : null
    };
  };

  if (completedSessions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Sessions</h3>
          <p className="text-gray-600">
            Results will appear here after you complete your first session.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total sessions finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedSessions.reduce((acc, s) => acc + (s.participantCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(completedSessions
                .map(s => getSessionStats(s).duration)
                .filter(d => d !== null)
                .reduce((acc: number, d) => acc + (d || 0), 0) / completedSessions.length || 0)} min
            </div>
            <p className="text-xs text-muted-foreground">
              Per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Generated</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSessions.length * 2}</div>
            <p className="text-xs text-muted-foreground">
              MD + CSV reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Session Results */}
      <Card>
        <CardHeader>
          <CardTitle>Session Results</CardTitle>
          <CardDescription>
            Download individual student reports (.md) and consolidated data (.csv) for each session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedSessions.map((session) => {
              const stats = getSessionStats(session);
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold">{session.topic}</h4>
                      <Badge variant="outline">{session.gradeLevel}</Badge>
                      <Badge variant="secondary">{session.sessionType}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(new Date(session.createdAt))}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{stats.totalParticipants} participants</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>Avg Score: {stats.averageScore}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{stats.duration || 0} minutes</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadResults(session.id, 'md')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Individual Reports
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadResults(session.id, 'csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV Data
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Notice for Phase 3 */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <CardTitle className="text-yellow-800">Phase 3 Feature</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">
            File generation and detailed analytics will be implemented in Phase 3. 
            This dashboard currently shows mock data and UI structure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
