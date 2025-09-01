import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';

export const useUserDataCheck = () => {
  const { user } = useAuth();
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check for participants data in Firebase
        const db = getFirestore();
        const participantsRef = collection(db, FIRESTORE_COLLECTIONS.participants);
        let participantsQuery = user.role === 'chair' && user.council
          ? query(participantsRef, where("council", "==", user.council))
          : participantsRef;
        
        const participantsSnapshot = await getDocs(participantsQuery);
        const hasParticipants = !participantsSnapshot.empty;

        // Check for files data in Supabase
        const { data: files } = await supabase
          .from('files')
          .select('id')
          .eq('uploaded_by', user.id)
          .limit(1);
        
        const hasFiles = files && files.length > 0;

        // For now, we'll mainly check participants and files
        // councils data is typically predefined, not user-created
        const userHasData = hasParticipants || hasFiles;
        
        setHasData(userHasData);
      } catch (error) {
        console.error('Error checking user data:', error);
        // If there's an error, assume they have data to avoid showing popup unnecessarily
        setHasData(true);
      } finally {
        setLoading(false);
      }
    };

    checkUserData();
  }, [user]);

  return { hasData, loading };
};