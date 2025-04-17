
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useParticipants } from '@/hooks/useParticipants';
import { ParticipantForm } from '@/components/attendance/ParticipantForm';
import { CSVImport } from '@/components/attendance/CSVImport';
import { AttendanceTable } from '@/components/attendance/AttendanceTable';
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { AttendanceExport } from '@/components/attendance/AttendanceExport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, ListFilter, FileText, RefreshCw, Loader2, Users, Download } from 'lucide-react';
import { toast } from 'sonner';

const AdminAttendance = () => {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<'day1' | 'day2'>('day1');
  const [selectedCouncil, setSelectedCouncil] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    participants, 
    loading, 
    error, 
    isDay1, 
    isDay2, 
    addParticipant,
    addMultipleParticipants,
    markAttendance, 
    batchMarkAttendance 
  } = useParticipants();

  // Get list of councils for filtering
  const councils = Array.from(new Set(participants.map(p => p.council))).sort();
  
  // Filter participants by selected council
  const filteredParticipants = selectedCouncil === 'all'
    ? participants
    : participants.filter(p => p.council === selectedCouncil);
  
  // Handle refresh data
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    
    try {
      // This would be replaced with actual API call in production
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Attendance data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-x-hidden">
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 overflow-y-auto w-full">
        <div className={`p-4 ${isMobile ? 'pb-24' : 'p-8'} animate-fade-in`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Administration</h1>
              <p className="text-gray-500 mt-1">
                Manage participants and monitor attendance across all councils
              </p>
            </div>
            
            <Button 
              onClick={handleRefreshData} 
              variant="outline" 
              disabled={isRefreshing} 
              className="w-full sm:w-auto"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw size={16} className="mr-2" />
              )}
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="ml-3 text-gray-600">Loading attendance data...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800">
              {error}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <ListFilter size={18} className="text-primary" />
                      Attendance Filters
                    </CardTitle>
                    <CardDescription>
                      Filter attendance data by council and date
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium">Select Council</label>
                        <Select
                          value={selectedCouncil}
                          onValueChange={setSelectedCouncil}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select council" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Councils</SelectItem>
                            {councils.map(council => (
                              <SelectItem key={council} value={council}>{council}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Date</label>
                        <div className="flex gap-2">
                          <Button
                            variant={selectedDate === 'day1' ? 'default' : 'outline'}
                            onClick={() => setSelectedDate('day1')}
                            disabled={!isDay1}
                            size="sm"
                            className={`flex-1 sm:flex-none ${!isDay1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Day 1 (16th March)
                          </Button>
                          <Button
                            variant={selectedDate === 'day2' ? 'default' : 'outline'}
                            onClick={() => setSelectedDate('day2')}
                            disabled={!isDay2}
                            size="sm"
                            className={`flex-1 sm:flex-none ${!isDay2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Day 2 (17th March)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <AttendanceSummary 
                participants={filteredParticipants} 
                selectedDate={selectedDate}
                council={selectedCouncil !== 'all' ? selectedCouncil : undefined}
              />
              
              <div className="mt-6">
                <Tabs defaultValue="view" className="w-full">
                  <TabsList className="grid grid-cols-3 md:w-[600px] mb-4">
                    <TabsTrigger value="view" className="flex items-center gap-2">
                      <Users size={16} /> 
                      <span>View Attendance</span>
                    </TabsTrigger>
                    <TabsTrigger value="manage" className="flex items-center gap-2">
                      <UserPlus size={16} /> 
                      <span>Manage Participants</span>
                    </TabsTrigger>
                    <TabsTrigger value="export" className="flex items-center gap-2">
                      <Download size={16} /> 
                      <span>Export Data</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="view" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-medium">
                          <FileText size={18} className="text-primary" />
                          Attendance Overview
                        </CardTitle>
                        <CardDescription>
                          {selectedCouncil === 'all' 
                            ? 'View attendance across all councils' 
                            : `View attendance for ${selectedCouncil}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AttendanceTable
                          participants={filteredParticipants}
                          selectedDate={selectedDate}
                          isDateLocked={false}
                          showCouncil={selectedCouncil === 'all'}
                          onMarkAttendance={markAttendance}
                          onBatchMarkAttendance={batchMarkAttendance}
                          readOnly={true}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="manage" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ParticipantForm 
                        onSubmit={addParticipant} 
                        councils={councils} 
                      />
                      
                      <CSVImport 
                        onImport={addMultipleParticipants}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="export" className="space-y-4">
                    <AttendanceExport
                      participants={participants}
                      councils={councils}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
