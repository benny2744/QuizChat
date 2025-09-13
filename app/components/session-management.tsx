
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Play, 
  Pause, 
  Copy, 
  Users, 
  Clock, 
  Calendar,
  Settings,
  Trash2 
} from 'lucide-react';
import { SessionData } from '@/lib/types';
import { formatDate, getSessionStatus } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SessionManagementProps {
  sessions: SessionData[];
  onSessionUpdate: () => void;
}

export function SessionManagement({ sessions, onSessionUpdate }: SessionManagementProps) {
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

  const setLoading = (sessionId: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [sessionId]: loading }));
  };

  const copySessionCode = (sessionCode: string) => {
    navigator.clipboard.writeText(sessionCode);
    toast({
      title: "Session Code Copied!",
      description: `Code ${sessionCode} has been copied to clipboard.`
    });
  };

  const toggleSession = async (sessionId: string, isActive: boolean) => {
    setLoading(sessionId, true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      toast({
        title: isActive ? "Session Stopped" : "Session Started",
        description: isActive ? "Students can no longer join this session." : "Students can now join this session."
      });

      onSessionUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update session status.",
        variant: "destructive"
      });
    } finally {
      setLoading(sessionId, false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    setLoading(sessionId, true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      toast({
        title: "Session Deleted",
        description: "The session has been permanently deleted."
      });

      onSessionUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete session.",
        variant: "destructive"
      });
    } finally {
      setLoading(sessionId, false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
            <p className="text-gray-600">
              Create your first session to start engaging with students.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Active Sessions - Priority Display */}
          {sessions.filter(s => s.isActive).length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <CardTitle className="text-lg">Active Sessions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.filter(s => s.isActive).map((session) => (
                    <Card key={session.id} className="border-green-200 bg-green-50/50">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-green-900">{session.topic}</h4>
                            <p className="text-sm text-green-700">{session.gradeLevel} • {session.sessionType}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Active
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Session Code:</span>
                            <div className="flex items-center space-x-2">
                              <code className="bg-white px-2 py-1 rounded font-mono text-green-800 border">
                                {session.sessionCode}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copySessionCode(session.sessionCode)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Participants:</span>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{session.participantCount || 0}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleSession(session.id, true)}
                              disabled={loadingStates[session.id]}
                              className="flex-1"
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Stop
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Grade Level</TableHead>
                      <TableHead>Session Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => {
                      const status = getSessionStatus(session);
                      return (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{session.topic}</div>
                              <div className="text-sm text-gray-600">{session.sessionType}</div>
                            </div>
                          </TableCell>
                          <TableCell>{session.gradeLevel}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                {session.sessionCode}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copySessionCode(session.sessionCode)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(status)}>
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-gray-600" />
                              <span>{session.participantCount || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(new Date(session.createdAt))}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleSession(session.id, session.isActive)}
                                disabled={loadingStates[session.id]}
                              >
                                {session.isActive ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSession(session.id)}
                                disabled={loadingStates[session.id]}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
