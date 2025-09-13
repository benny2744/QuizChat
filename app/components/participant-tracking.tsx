
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, Activity, RefreshCw } from 'lucide-react';
import { SessionData, ActiveParticipantData } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

interface ParticipantTrackingProps {
  activeSessions: SessionData[];
}

export function ParticipantTracking({ activeSessions }: ParticipantTrackingProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [participants, setParticipants] = useState<ActiveParticipantData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchParticipants = async (sessionId: string) => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      fetchParticipants(selectedSessionId);
      const interval = setInterval(() => {
        fetchParticipants(selectedSessionId);
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    // Auto-select first active session if available
    if (activeSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(activeSessions[0].id);
    }
  }, [activeSessions, selectedSessionId]);

  const selectedSession = activeSessions.find(s => s.id === selectedSessionId);

  const getQuestionLevelColor = (level: string) => {
    switch (level) {
      case 'Basic': return 'bg-green-100 text-green-800';
      case 'Scenario': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityStatus = (lastActivity: Date) => {
    const now = new Date();
    const diffMinutes = (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60);
    
    if (diffMinutes < 1) return { status: 'active', color: 'bg-green-100 text-green-800' };
    if (diffMinutes < 5) return { status: 'recent', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'idle', color: 'bg-gray-100 text-gray-800' };
  };

  const questionLevelCounts = participants.reduce((acc, p) => {
    acc[p.currentQuestionLevel] = (acc[p.currentQuestionLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (activeSessions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
          <p className="text-gray-600">
            Start a session to see real-time participant tracking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Session Monitoring</CardTitle>
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-sm text-gray-600">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchParticipants(selectedSessionId)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Session to Monitor</label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an active session" />
                </SelectTrigger>
                <SelectContent>
                  {activeSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.topic} ({session.sessionCode}) - {session.participantCount || 0} participants
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSession && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{participants.length}</div>
                  <div className="text-sm text-gray-600">Active Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{questionLevelCounts.Basic || 0}</div>
                  <div className="text-sm text-gray-600">Basic Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{questionLevelCounts.Scenario || 0}</div>
                  <div className="text-sm text-gray-600">Scenario Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{questionLevelCounts.Advanced || 0}</div>
                  <div className="text-sm text-gray-600">Advanced Level</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      {selectedSessionId && (
        <Card>
          <CardHeader>
            <CardTitle>Live Participant Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No participants have joined this session yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((participant) => {
                  const activityStatus = getActivityStatus(participant.lastActivity);
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{participant.studentName}</div>
                          <div className="text-sm text-gray-600 flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              Last activity: {formatDuration(new Date(participant.lastActivity))} ago
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={getQuestionLevelColor(participant.currentQuestionLevel)}>
                          {participant.currentQuestionLevel}
                        </Badge>
                        <Badge className={activityStatus.color}>
                          <Activity className="h-3 w-3 mr-1" />
                          {activityStatus.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {participants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Question Level Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Basic</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${((questionLevelCounts.Basic || 0) / participants.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{questionLevelCounts.Basic || 0}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Scenario</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${((questionLevelCounts.Scenario || 0) / participants.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{questionLevelCounts.Scenario || 0}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Advanced</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${((questionLevelCounts.Advanced || 0) / participants.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{questionLevelCounts.Advanced || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Activity Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm">Active (&lt; 1 min)</span>
                  </div>
                  <span className="font-medium">
                    {participants.filter(p => getActivityStatus(p.lastActivity).status === 'active').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-sm">Recent (&lt; 5 min)</span>
                  </div>
                  <span className="font-medium">
                    {participants.filter(p => getActivityStatus(p.lastActivity).status === 'recent').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full" />
                    <span className="text-sm">Idle (&gt; 5 min)</span>
                  </div>
                  <span className="font-medium">
                    {participants.filter(p => getActivityStatus(p.lastActivity).status === 'idle').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Session Timer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {selectedSession?.startTime ? (
                  <div className="text-2xl font-mono font-bold text-blue-600">
                    {formatDuration(new Date(selectedSession.startTime))}
                  </div>
                ) : (
                  <div className="text-2xl font-mono font-bold text-gray-400">
                    --:--
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-1">Session Duration</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
