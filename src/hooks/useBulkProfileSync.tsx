import { useState } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/firebaseService';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';

export const useBulkProfileSync = () => {
  const [loading, setLoading] = useState(false);

  const syncAllFirebaseUsersToSupabase = async () => {
    setLoading(true);
    
    try {
      console.log('Starting bulk sync of Firebase users to Supabase profiles...');
      
      // Get all users from Firebase
      const firebaseUsers = await authService.getUsers();
      console.log('Found Firebase users:', firebaseUsers.length);
      
      let syncedCount = 0;
      let errorCount = 0;
      
      for (const firebaseUser of firebaseUsers) {
        try {
          console.log('Syncing user:', firebaseUser.username);
          
          // Prepare user data for Supabase
          const userData = {
            id: firebaseUser.id,
            username: firebaseUser.username || '',
            name: firebaseUser.name || '',
            role: firebaseUser.role,
            council: firebaseUser.council,
            email: firebaseUser.email,
            room_no: firebaseUser.room_no,
            floor_no: firebaseUser.floor_no,
            has_completed_tour: firebaseUser.hasCompletedTour || false,
            last_login: new Date().toISOString()
          };
          
          // Use upsert to handle both new and existing users
          const { error } = await supabase
            .from('profiles')
            .upsert(userData, {
              onConflict: 'id'
            });
          
          if (error) {
            console.error(`Error syncing user ${firebaseUser.username}:`, error);
            errorCount++;
          } else {
            console.log(`Successfully synced user ${firebaseUser.username}`);
            syncedCount++;
          }
        } catch (userError) {
          console.error(`Error processing user ${firebaseUser.username}:`, userError);
          errorCount++;
        }
      }
      
      console.log(`Bulk sync completed. Synced: ${syncedCount}, Errors: ${errorCount}`);
      
      if (syncedCount > 0) {
        toast.success(`Successfully synced ${syncedCount} users to profiles table`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to sync ${errorCount} users`);
      }
      
      return { syncedCount, errorCount };
    } catch (error) {
      console.error('Bulk sync failed:', error);
      toast.error('Failed to sync users to profiles table');
      return { syncedCount: 0, errorCount: 1 };
    } finally {
      setLoading(false);
    }
  };

  return { syncAllFirebaseUsersToSupabase, loading };
};