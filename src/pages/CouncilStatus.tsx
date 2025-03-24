import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge, type CouncilStatus as CouncilStatusType } from '@/components/ui/StatusBadge';
import { toast } from "sonner";
import { ArrowUpDown, Search, RefreshCw } from 'lucide-react';
import useWebSocket from '@/hooks/useWebSocket';

type Council = {
  id: string;
  name: string;
  chairName: string;
  status: CouncilStatusType;
  lastUpdate: Date;
  location: string;
  delegates: number;
};

const CouncilStatus = () => {
  const [councils, setCouncils] = useState<Council[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Council;
    direction: 'ascending' | 'descending';
  }>({
    key: 'name',
    direction: 'ascending'
  });

  // Set up WebSocket connection for council status updates
  const { data: statusUpdate } = useWebSocket<{councilId: string, status: CouncilStatusType}>('COUNCIL_STATUS_UPDATE');

  // Initialize mock data
  useEffect(() => {
    fetchCouncils();
    
    // With WebSocket, we don't need frequent polling
    // Just do a full refresh occasionally to ensure consistency
    const intervalId = setInterval(() => {
      fetchCouncils(false);
    }, 60000); // Reduced frequency to once per minute
    
    return () => clearInterval(intervalId);
  }, []);

  // Handle WebSocket status updates
  useEffect(() => {
    if (statusUpdate && statusUpdate.councilId) {
      setCouncils(prev => prev.map(council => 
        council.id === statusUpdate.councilId 
          ? { ...council, status: statusUpdate.status, lastUpdate: new Date() }
          : council
      ));
      
      // Only show toast for significant changes
      const affectedCouncil = councils.find(c => c.id === statusUpdate.councilId);
      if (affectedCouncil && affectedCouncil.status !== statusUpdate.status) {
        toast.info(`${affectedCouncil.name} status changed to ${statusUpdate.status.replace('-', ' ')}`);
      }
    }
  }, [statusUpdate, councils]);

  // Fetch councils data (mock)
  const fetchCouncils = (showToast = true) => {
    setIsRefreshing(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockCouncils: Council[] = [
        {
          id: '1',
          name: 'Security Council',
          chairName: 'John Smith',
          status: 'in-session',
          lastUpdate: new Date(),
          location: 'Room A101',
          delegates: 15
        },
        {
          id: '2',
          name: 'Human Rights Council',
          chairName: 'Emma Johnson',
          status: 'on-break',
          lastUpdate: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          location: 'Room B202',
          delegates: 20
        },
        {
          id: '3',
          name: 'Economic and Social Council',
          chairName: 'Michael Brown',
          status: 'technical-issue',
          lastUpdate: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          location: 'Room C303',
          delegates: 25
        },
        {
          id: '4',
          name: 'General Assembly',
          chairName: 'Sarah Wilson',
          status: 'in-session',
          lastUpdate: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
          location: 'Main Hall',
          delegates: 50
        },
        {
          id: '5',
          name: 'Environmental Committee',
          chairName: 'Alex Thompson',
          status: 'on-break',
          lastUpdate: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
          location: 'Room D404',
          delegates: 18
        }
      ];
      
      setCouncils(mockCouncils);
      setIsRefreshing(false);
      if (showToast) {
        toast.success('Council status updated');
      }
    }, 800);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchCouncils();
  };

  // Handle sorting
  const requestSort = (key: keyof Council) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  // Sort and filter councils
  const sortedAndFilteredCouncils = React.useMemo(() => {
    let sortableCouncils = [...councils];
    
    // Filter by search term
    if (searchTerm) {
      sortableCouncils = sortableCouncils.filter(
        council => 
          council.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          council.chairName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          council.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    sortableCouncils.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    return sortableCouncils;
  }, [councils, searchTerm, sortConfig]);

  // Get status counts
  const statusCounts = React.useMemo(() => {
    return councils.reduce((acc, council) => {
      acc[council.status] = (acc[council.status] || 0) + 1;
      return acc;
    }, {} as Record<CouncilStatus, number>);
  }, [councils]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Council Status Board</h1>
            <p className="text-gray-600 mt-1">
              Real-time overview of all council sessions
            </p>
          </header>
          
          {/* Status Summary */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <div className="w-6 h-6 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Session</p>
                <p className="text-xl font-semibold text-primary">
                  {statusCounts['in-session'] || 0}
                </p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                <div className="w-6 h-6 rounded-full bg-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">On Break</p>
                <p className="text-xl font-semibold text-primary">
                  {statusCounts['on-break'] || 0}
                </p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <div className="w-6 h-6 rounded-full bg-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Technical Issue</p>
                <p className="text-xl font-semibold text-primary">
                  {statusCounts['technical-issue'] || 0}
                </p>
              </div>
            </div>
          </div>
          
          {/* Search and Controls */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search councils..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent"
              />
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent button-transition ${
                isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
          
          {/* Councils Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center">
                        <span>Council</span>
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('chairName')}
                    >
                      <div className="flex items-center">
                        <span>Chair</span>
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('status')}
                    >
                      <div className="flex items-center">
                        <span>Status</span>
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('location')}
                    >
                      <div className="flex items-center">
                        <span>Location</span>
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('delegates')}
                    >
                      <div className="flex items-center">
                        <span>Delegates</span>
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('lastUpdate')}
                    >
                      <div className="flex items-center">
                        <span>Last Update</span>
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAndFilteredCouncils.length > 0 ? (
                    sortedAndFilteredCouncils.map((council) => (
                      <tr key={council.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-primary">{council.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{council.chairName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge 
                            status={council.status} 
                            councilId={council.id}
                            onStatusChange={(newStatus) => {
                              setCouncils(prev => prev.map(c => 
                                c.id === council.id 
                                  ? { ...c, status: newStatus, lastUpdate: new Date() }
                                  : c
                              ));
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {council.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {council.delegates}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {council.lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No councils found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Real-time indicator */}
            <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500 flex items-center justify-end">
              <span>Real-time updates active</span>
              <div className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouncilStatus;
