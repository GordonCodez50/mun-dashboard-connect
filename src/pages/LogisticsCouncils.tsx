import React, { useState, useEffect, useMemo } from 'react';
import { LogisticsLayout } from '@/components/layout/LogisticsLayout';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime';
import { 
  AlertCircle,
  RefreshCw,
  Search,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CouncilData {
  council: string;
  chairName: string;
  room_no?: string;
  floor_no?: string;
  attendance: {
    present: number;
    absent: number;
    notMarked: number;
    total: number;
  };
}

const LogisticsCouncils = () => {
  const [councils, setCouncils] = useState<CouncilData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');

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

  const fetchCouncilsData = async () => {
    try {
      setError(null);
      
      // Fetch chairs with their room and floor info
      const { data: chairsData, error: chairsError } = await supabase
        .from('profiles')
        .select('name, council, room_no, floor_no')
        .eq('role', 'chair')
        .not('council', 'is', null);

      if (chairsError) {
        console.error('Error fetching chairs:', chairsError);
        throw new Error('Failed to load chair data');
      }

      // Fetch all participants with attendance data (excluding press)
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('council, attendance, role')
        .neq('role', 'member'); // Exclude press members

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw new Error('Failed to load participant data');
      }

      // Process the data to create council overview
      const councilMap = new Map<string, CouncilData>();

      // Initialize councils from chairs data (excluding PRESS)
      chairsData?.forEach(chair => {
        if (chair.council && chair.council.toUpperCase() !== 'PRESS') {
          councilMap.set(chair.council, {
            council: chair.council,
            chairName: chair.name || 'Unknown',
            room_no: chair.room_no || undefined,
            floor_no: chair.floor_no || undefined,
            attendance: {
              present: 0,
              absent: 0,
              notMarked: 0,
              total: 0
            }
          });
        }
      });

      // Calculate attendance for each council (using day1)
      participantsData?.forEach(participant => {
        const councilData = councilMap.get(participant.council);
        if (councilData) {
          // Get attendance status for day1, fallback to 'not-marked'
          const attendance = participant.attendance as any;
          const attendanceStatus = (attendance && typeof attendance === 'object' && attendance.day1) || 'not-marked';
          
          councilData.attendance.total++;
          switch (attendanceStatus) {
            case 'present':
              councilData.attendance.present++;
              break;
            case 'absent':
              councilData.attendance.absent++;
              break;
            default: // 'not-marked' or any other value
              councilData.attendance.notMarked++;
              break;
          }
        }
      });

      // Convert map to array and sort by council name
      const councilsArray = Array.from(councilMap.values()).sort((a, b) => 
        a.council.localeCompare(b.council)
      );

      setCouncils(councilsArray);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load councils data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouncilsData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCouncilsData();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  // Get unique floors for filter
  const uniqueFloors = useMemo(() => {
    const floors = councils
      .map(council => council.floor_no)
      .filter(floor => floor && floor.trim() !== '')
      .filter((floor, index, arr) => arr.indexOf(floor) === index)
      .sort();
    return floors;
  }, [councils]);

  // Filter councils based on search and floor
  const filteredCouncils = useMemo(() => {
    let filtered = councils.filter(council => {
      const matchesSearch = council.council.toLowerCase().includes(searchQuery.toLowerCase()) ||
        council.chairName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (council.room_no && council.room_no.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFloor = selectedFloor === 'all' || council.floor_no === selectedFloor;
      
      return matchesSearch && matchesFloor;
    });

    return filtered;
  }, [councils, searchQuery, selectedFloor]);

  if (error) {
    return (
      <LogisticsLayout activeItem="councils">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Error loading councils: {error}</p>
            </div>
          </CardContent>
        </Card>
      </LogisticsLayout>
    );
  }

  return (
    <>
      <SEOHead 
        title="Councils Overview"
        description="View all councils with their chairs, locations, and attendance statistics for BMUNIS conference logistics operations."
        canonicalUrl="/logistics-councils"
      />
      
      <LogisticsLayout activeItem="councils">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Councils Overview</h1>
              <p className="text-muted-foreground">
                Monitor all councils, their locations, and attendance statistics
              </p>
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

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search councils, chairs, or rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedFloor} onValueChange={setSelectedFloor}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by floor" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="all">All Floors</SelectItem>
                {uniqueFloors.map((floor) => (
                  <SelectItem key={floor} value={floor}>
                    Floor {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Councils Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Councils Details ({filteredCouncils.length} councils)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : councils.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No councils found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    No chair data available or councils have not been set up yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Council</TableHead>
                        <TableHead className="font-semibold">Floor</TableHead>
                        <TableHead className="font-semibold">Room</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Total Attendees</TableHead>
                        <TableHead className="font-semibold">Present</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Not Marked</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCouncils.map((council) => (
                        <TableRow key={council.council} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{council.council}</TableCell>
                          <TableCell>
                            {council.floor_no || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {council.room_no || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="font-medium hidden md:table-cell">
                            {council.attendance.total}
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {council.attendance.present}
                          </TableCell>
                          <TableCell className="text-yellow-600 font-medium hidden md:table-cell">
                            {council.attendance.notMarked}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </LogisticsLayout>
    </>
  );
};

export default LogisticsCouncils;