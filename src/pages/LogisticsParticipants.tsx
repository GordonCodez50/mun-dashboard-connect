import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogisticsLayout } from '@/components/layout/LogisticsLayout';
import { SEOHead } from '@/components/SEOHead';
import { toast } from "sonner";
import { useParticipants } from '@/hooks/useParticipants';
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime';
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertCircle,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// Define attendance status type
type AttendanceStatus = 'present' | 'absent' | 'not-marked';

interface ParticipantWithAttendance {
  id: string;
  name: string;
  council: string;
  role: string;
  attendance: {
    day1: AttendanceStatus;
    day2: AttendanceStatus;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const LogisticsParticipants = () => {
  const { user } = useAuth();
  const { participants, loading, error } = useParticipants();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCouncil, setSelectedCouncil] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<'day1' | 'day2'>(() => {
    // Default to Day 1
    return 'day1';
  });

  // Alerts integration - same as LogisticsDashboard
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [alertsMuted, setAlertsMuted] = useState(() => {
    const savedMuted = localStorage.getItem('logistics_alertsMuted');
    return savedMuted ? JSON.parse(savedMuted) : false;
  });

  // Use Firebase Realtime Database for alerts
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');

  // Use alerts sound hook
  useAlertsSound(liveAlerts, alertsMuted);

  // Process alerts data
  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      const processedAlerts = alertsData
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          ...item,
          timestamp: item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp || Date.now())
        }))
        .filter(alert => 
          alert && 
          alert.id && 
          alert.type && 
          alert.council && 
          alert.message &&
          alert.type !== 'undefined' &&
          alert.council !== 'undefined' &&
          alert.message !== 'undefined' &&
          (alert.replyFrom === 'admin' || 
           alert.replyFrom === 'chair' || 
           alert.replyFrom === 'press' || 
           alert.replyFrom === 'logistics' ||
           !alert.replyFrom)
        );

      setLiveAlerts(processedAlerts);
    }
  }, [alertsData]);
  useEffect(() => {
    if (user?.council && user.council !== 'PRESS' && selectedCouncil === 'all') {
      setSelectedCouncil(user.council);
    }
  }, [user?.council, selectedCouncil]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Data refreshed');
    }, 1000);
  };

  // Filter participants based on search and filters (exclude press members)
  const filteredParticipants = participants.filter(participant => {
    // Exclude press members
    if (participant.council === 'PRESS') {
      return false;
    }
    
    // Name search
    if (searchTerm && !participant.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Council filter (if user has specific council, always filter to that)
    if (user?.council && user.council !== 'PRESS') {
      if (participant.council !== user.council) {
        return false;
      }
    } else if (selectedCouncil !== 'all') {
      if (participant.council !== selectedCouncil) {
        return false;
      }
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      const attendanceStatus = participant.attendance[selectedDay];
      if (attendanceStatus !== selectedStatus) {
        return false;
      }
    }
    
    return true;
  });

  // Get unique councils from participants (exclude press members)
  const councils = Array.from(new Set(participants.filter(p => p.council !== 'PRESS').map(p => p.council))).sort();

  // Calculate statistics (exclude press members)
  const calculateStats = () => {
    const relevantParticipants = user?.council && user.council !== 'PRESS' 
      ? participants.filter(p => p.council === user.council && p.council !== 'PRESS')
      : participants.filter(p => p.council !== 'PRESS');

    const total = relevantParticipants.length;
    const present = relevantParticipants.filter(p => 
      p.attendance[selectedDay] === 'present'
    ).length;
    const absent = relevantParticipants.filter(p => 
      p.attendance[selectedDay] === 'absent'
    ).length;
    const notMarked = relevantParticipants.filter(p => 
      p.attendance[selectedDay] === 'not-marked'
    ).length;

    return { total, present, absent, notMarked };
  };

  // Calculate stats per council (exclude press members)
  const calculateCouncilStats = () => {
    const councilStats: Record<string, { total: number; present: number; absent: number; notMarked: number }> = {};
    
    councils.forEach(council => {
      const councilParticipants = participants.filter(p => p.council === council && p.council !== 'PRESS');
      const total = councilParticipants.length;
      const present = councilParticipants.filter(p => 
        p.attendance[selectedDay] === 'present'
      ).length;
      const absent = councilParticipants.filter(p => 
        p.attendance[selectedDay] === 'absent'
      ).length;
      const notMarked = councilParticipants.filter(p => 
        p.attendance[selectedDay] === 'not-marked'
      ).length;

      councilStats[council] = { total, present, absent, notMarked };
    });

    return councilStats;
  };

  const stats = calculateStats();
  const councilStats = calculateCouncilStats();

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'not-marked':
        return <Badge variant="outline">Not Marked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (error) {
    return (
      <LogisticsLayout activeItem="participants">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Error loading participants: {error}</p>
            </div>
          </CardContent>
        </Card>
      </LogisticsLayout>
    );
  }

  return (
    <>
      <SEOHead 
        title="Logistics Participants"
        description="View and track participant attendance data for BMUNIS conference logistics operations. Monitor council-specific attendance and overall participation statistics."
        canonicalUrl="/logistics-participants"
      />
      
      <LogisticsLayout activeItem="participants">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Participants</h1>
              <p className="text-muted-foreground">
                Track attendance and manage participant data
                {user?.council && user.council !== 'PRESS' && (
                  <span className="ml-2 text-primary">• {user.council}</span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Day selector */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={selectedDay === 'day1' ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => {
                    setSelectedDay('day1');
                    toast.success("Switched to Day 1");
                  }}
                >
                  Day 1
                </Button>
                <Button
                  variant={selectedDay === 'day2' ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => {
                    setSelectedDay('day2');
                    toast.success("Switched to Day 2");
                  }}
                >
                  Day 2
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats.total}</div>
                )}
                <p className="text-xs text-muted-foreground">Participants</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                )}
                <p className="text-xs text-muted-foreground">Attending today</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                )}
                <p className="text-xs text-muted-foreground">Not attending</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Not Marked</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-yellow-600">{stats.notMarked}</div>
                )}
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>


          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Participant List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search participants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                </div>
                
                {(!user?.council || user.council === 'PRESS') && (
                  <Select value={selectedCouncil} onValueChange={setSelectedCouncil}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by council" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Councils</SelectItem>
                      {councils.map(council => (
                        <SelectItem key={council} value={council}>{council}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="not-marked">Not Marked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Participants Table */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Council</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                              No participants found
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your search or filter criteria
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredParticipants.map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell className="font-medium">
                              {participant.name}
                            </TableCell>
                            <TableCell>{participant.council}</TableCell>
                            <TableCell className="capitalize">{participant.role}</TableCell>
                            <TableCell>
                              {getStatusBadge(
                                participant.attendance[selectedDay]
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {!loading && filteredParticipants.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  Showing {filteredParticipants.length} of {participants.filter(p => p.council !== 'PRESS').length} participants
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </LogisticsLayout>
    </>
  );
};

export default LogisticsParticipants;