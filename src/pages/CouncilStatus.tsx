
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge, CouncilStatus as CouncilStatusType } from '@/components/ui/StatusBadge';
import { firestoreService, realtimeService } from '@/services/firebaseService';
import { toast } from 'sonner';

type Council = {
  id: string;
  name: string;
  status: CouncilStatusType;
  lastUpdate?: Date;
};

const CouncilStatus = () => {
  const [councils, setCouncils] = useState<Council[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load councils on component mount
  useEffect(() => {
    const loadCouncils = async () => {
      try {
        const councilsData = await firestoreService.getCouncils();
        setCouncils(councilsData as Council[]);
      } catch (error) {
        console.error('Error loading councils:', error);
        toast.error('Failed to load council data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCouncils();
  }, []);

  // Update council status
  const handleStatusChange = async (councilId: string, newStatus: CouncilStatusType) => {
    try {
      // Update status in Firebase
      const success = await realtimeService.updateCouncilStatus(councilId, newStatus);
      
      if (success) {
        // Update local state
        setCouncils(prev => 
          prev.map(council => 
            council.id === councilId 
              ? { ...council, status: newStatus, lastUpdate: new Date() } 
              : council
          )
        );
        
        toast.success('Council status updated');
      }
    } catch (error) {
      console.error('Error updating council status:', error);
      toast.error('Failed to update council status');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Council Status</h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage the status of all councils
            </p>
          </header>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {councils.map(council => (
                <div 
                  key={council.id}
                  className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-fade-in"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-primary">{council.name}</h2>
                    <StatusBadge status={council.status} size="md" councilId={council.id} />
                  </div>
                  
                  <div className="mt-6">
                    <div className="text-sm text-gray-500 mb-3">Update status:</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleStatusChange(council.id, 'in-session')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          council.status === 'in-session'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50'
                        }`}
                      >
                        In Session
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange(council.id, 'on-break')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          council.status === 'on-break'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-yellow-50'
                        }`}
                      >
                        On Break
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange(council.id, 'technical-issue')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          council.status === 'technical-issue'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-red-50'
                        }`}
                      >
                        Technical Issue
                      </button>
                    </div>
                  </div>
                  
                  {council.lastUpdate && (
                    <div className="mt-4 text-xs text-gray-500">
                      Last updated: {council.lastUpdate.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouncilStatus;
