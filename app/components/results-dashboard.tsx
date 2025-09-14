
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, FileText, Calendar, Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { SessionData } from '@/lib/types';
import { formatDate, getSessionStatus } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ResultsDashboardProps {
  sessions: SessionData[];
}

interface AssessmentSummary {
  sessionId: string;
  topic: string;
  sessionType: string;
  totalStudents: number;
  completedAssessments: number;
  averageScore: number;
  students: Array<{
    name: string;
    score: number | null;
    feedback: string | null;
    messageCount: number;
    duration: number | null;
    startTime?: Date;
    endTime?: Date;
  }>;
}

export function ResultsDashboard({ sessions }: ResultsDashboardProps) {
  const [assessmentSummaries, setAssessmentSummaries] = useState<{[key: string]: AssessmentSummary}>({});
  const [loadingAssessments, setLoadingAssessments] = useState<{[key: string]: boolean}>({});
  const [downloadingReports, setDownloadingReports] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  
  const completedSessions = sessions.filter(s => !s.isActive && s.endTime);

  // Load assessment summaries for completed sessions
  useEffect(() => {
    completedSessions.forEach(session => {
      if (!assessmentSummaries[session.id] && !loadingAssessments[session.id]) {
        loadAssessmentSummary(session.id);
      }
    });
  }, [completedSessions]);

  const loadAssessmentSummary = async (sessionId: string) => {
    setLoadingAssessments(prev => ({ ...prev, [sessionId]: true }));
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/assessment`);
      if (response.ok) {
        const summary = await response.json();
        setAssessmentSummaries(prev => ({ ...prev, [sessionId]: summary }));
      }
    } catch (error) {
      console.error('Error loading assessment summary:', error);
    } finally {
      setLoadingAssessments(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleDownloadSessionCSV = async (sessionId: string) => {
    setDownloadingReports(prev => ({ ...prev, [`${sessionId}-csv`]: true }));
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/reports?format=csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session_data_${sessionId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Complete",
          description: "Session CSV data has been downloaded successfully."
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast({
        title: "Download Error",
        description: "Failed to download session data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingReports(prev => ({ ...prev, [`${sessionId}-csv`]: false }));
    }
  };

  const handleDownloadStudentReport = async (sessionId: string, studentName: string) => {
    setDownloadingReports(prev => ({ ...prev, [`${sessionId}-${studentName}`]: true }));
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/reports?format=md&student=${encodeURIComponent(studentName)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${studentName}_report.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Complete",
          description: `${studentName}'s report has been downloaded successfully.`
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Error", 
        description: `Failed to download ${studentName}'s report. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setDownloadingReports(prev => ({ ...prev, [`${sessionId}-${studentName}`]: false }));
    }
  };

  const calculateAssessments = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/assessment`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: "Assessments Calculated",
          description: "Student assessments have been calculated and saved."
        });
        // Reload the assessment summary
        await loadAssessmentSummary(sessionId);
      } else {
        throw new Error('Assessment calculation failed');
      }
    } catch (error) {
      console.error('Error calculating assessments:', error);
      toast({
        title: "Assessment Error",
        description: "Failed to calculate assessments. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getSessionStats = (session: SessionData) => {
    const summary = assessmentSummaries[session.id];
    if (summary) {
      return {
        totalParticipants: summary.totalStudents,
        averageScore: Math.round(summary.averageScore),
        duration: session.startTime && session.endTime 
          ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
          : null
      };
    }
    
    return {
      totalParticipants: session.participantCount || 0,
      averageScore: null,
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

  const totalParticipants = completedSessions.reduce((acc, s) => acc + (getSessionStats(s).totalParticipants || 0), 0);
  const averageDuration = Math.floor(
    completedSessions
      .map(s => getSessionStats(s).duration)
      .filter(d => d !== null)
      .reduce((acc: number, d) => acc + (d || 0), 0) / completedSessions.length || 0
  );
  const totalReportsGenerated = Object.keys(assessmentSummaries).length * 2; // MD + CSV per session

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
            <div className="text-2xl font-bold">{totalParticipants}</div>
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
            <div className="text-2xl font-bold">{averageDuration} min</div>
            <p className="text-xs text-muted-foreground">
              Per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(assessmentSummaries).length > 0
                ? Math.round(Object.values(assessmentSummaries).reduce((sum, s) => sum + s.averageScore, 0) / Object.values(assessmentSummaries).length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across assessed sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Session Results */}
      <Card>
        <CardHeader>
          <CardTitle>Session Results & Reports</CardTitle>
          <CardDescription>
            Calculate student assessments and download individual reports (.md) and consolidated data (.csv) for each session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedSessions.map((session) => {
              const stats = getSessionStats(session);
              const summary = assessmentSummaries[session.id];
              const isLoading = loadingAssessments[session.id];
              
              return (
                <div
                  key={session.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold">{session.topic}</h4>
                      <Badge variant="outline">{session.gradeLevel}</Badge>
                      <Badge variant="secondary">{session.sessionType}</Badge>
                      {summary && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Assessed
                        </Badge>
                      )}
                    </div>
                    
                    {!summary && !isLoading && (
                      <Button
                        onClick={() => calculateAssessments(session.id)}
                        size="sm"
                        variant="outline"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Calculate Assessments
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
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
                      <span>Avg Score: {stats.averageScore ? `${stats.averageScore}%` : 'Not calculated'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{stats.duration || 0} minutes</span>
                    </div>
                  </div>

                  {isLoading && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">Loading assessment data...</span>
                      </div>
                    </div>
                  )}

                  {summary && (
                    <>
                      {/* Student Results Summary */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h5 className="font-medium mb-3">Student Performance Summary</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {summary.students.map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <span className="font-medium">{student.name}</span>
                                <div className="text-sm text-gray-500">
                                  <span>{student.messageCount} messages</span>
                                  <span className="mx-2">•</span>
                                  <span>{student.duration !== null ? `${student.duration} min` : 'N/A'}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={student.score && student.score >= 70 ? "default" : "secondary"}>
                                  {student.score ? `${student.score}%` : 'N/A'}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadStudentReport(session.id, student.name)}
                                  disabled={downloadingReports[`${session.id}-${student.name}`]}
                                >
                                  {downloadingReports[`${session.id}-${student.name}`] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Download Buttons */}
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSessionCSV(session.id)}
                          disabled={downloadingReports[`${session.id}-csv`]}
                        >
                          {downloadingReports[`${session.id}-csv`] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Session CSV
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Phase 2 Features Complete */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <CardTitle className="text-green-800">Phase 2 Complete</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            ✅ Assessment scoring system implemented<br/>
            ✅ Individual student reports (Markdown)<br/>
            ✅ Consolidated session data (CSV)<br/>
            ✅ Real-time analytics and metrics
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
