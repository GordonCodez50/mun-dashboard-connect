import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReactPlayer from 'react-player';
import { PlayCircle, X, BookOpen } from 'lucide-react';
import { TUTORIAL_CONFIG } from '@/config/appConfig';

// Simple exponential backoff utility with max cap
const createBackoff = (baseMs = 1000, maxMs = 60000) => {
  let attempt = 0;
  return () => {
    const delay = Math.min(maxMs, baseMs * Math.pow(2, attempt));
    attempt += 1;
    return delay;
  };
};

export const ChairTutorialPopup: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'prompt' | 'video'>('prompt');
  const [checking, setChecking] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const retryTimerRef = useRef<number | null>(null);
  const isMounted = useRef(true);

  const videoUrl = useMemo(() => TUTORIAL_CONFIG.videoUrl, []);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  // Mark completion with resilient retry until success
  const markCompletedWithRetry = useCallback(() => {
    if (!user?.id) return;
    const nextDelay = createBackoff(1500, 60000);

    const attemptUpdate = async () => {
      if (!isMounted.current) return;
      try {
        console.log('Attempting to update profile for user:', user.id);
        console.log('User object:', user);
        
        // First, check if the profile exists
        const { data: existingProfile, error: selectError } = await supabase
          .from('profiles')
          .select('id, has_completed_tour')
          .eq('id', user.id)
          .maybeSingle();
        
        console.log('Existing profile:', existingProfile);
        console.log('Select error:', selectError);
        
        if (!existingProfile) {
          console.error('No profile found for user ID:', user.id);
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .update({ has_completed_tour: true, tutorial_completed_at: new Date().toISOString() })
          .eq('id', user.id)
          .select();
        
        if (error) {
          console.error('Error updating profile:', error);
          // schedule retry
          const delay = nextDelay();
          retryTimerRef.current = window.setTimeout(attemptUpdate, delay);
        } else {
          console.log('Successfully updated profile:', data);
          console.log('Update returned rows:', data?.length);
          if (data?.length === 0) {
            console.warn('Update succeeded but no rows were affected - possible RLS issue');
          }
          clearRetryTimer();
          return; // success
        }
      } catch (err) {
        console.error('Exception updating profile:', err);
        const delay = nextDelay();
        retryTimerRef.current = window.setTimeout(attemptUpdate, delay);
      }
    };

    attemptUpdate();
  }, [user?.id]);

  const handleSkip = () => {
    setShowExitConfirm(true);
  };

  const confirmSkip = () => {
    setShowExitConfirm(false);
    setOpen(false);
    markCompletedWithRetry();
  };

  const cancelSkip = () => {
    setShowExitConfirm(false);
  };

  const handleWatch = () => {
    setMode('video');
  };

  const handleVideoEnded = () => {
    setOpen(false);
    markCompletedWithRetry();
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearRetryTimer();
    };
  }, []);

  // Decide whether to show the popup
  useEffect(() => {
    const check = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      if (user.role !== 'chair') {
        setChecking(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('has_completed_tour')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        const completed = data?.has_completed_tour === true;
        setOpen(!completed);
      } catch {
        // On failure to fetch, default to not showing to avoid blocking UX
        setOpen(false);
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [user]);

  if (checking) return null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setShowExitConfirm(true);
          }
        }}
      >
        <DialogContent className={mode === 'video' ? 'w-[95vw] max-w-5xl p-0' : 'max-w-md'}>
          {mode === 'prompt' ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Welcome, Chair!
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Before you start, here's a quick video walkthrough to help you get familiar with the system.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleWatch} size="lg" className="flex-1">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Watch Tutorial
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleSkip} className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Skip Tutorial
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between px-4 pt-4">
                <DialogTitle className="text-base">Chair Tutorial</DialogTitle>
              </div>
              <div className="aspect-video w-full">
                <ReactPlayer
                  url={videoUrl}
                  width="100%"
                  height="100%"
                  controls
                  playing
                  onEnded={handleVideoEnded}
                  config={{
                    youtube: {
                      playerVars: { modestbranding: 1, rel: 0 },
                    },
                  }}
                />
              </div>
              <div className="flex items-center justify-end px-4 pb-4">
                <Button variant="outline" size="lg" onClick={handleSkip}>
                  Skip
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip Tutorial?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to skip the tutorial? You won't be able to access it again later. 
              This tutorial will help you understand how to use the chair dashboard effectively.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelSkip}>Continue Watching</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSkip}>Yes, Skip Tutorial</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
export default ChairTutorialPopup;