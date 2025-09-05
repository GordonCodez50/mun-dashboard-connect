import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordProtectedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  description: string;
  correctPassword: string;
}

export const PasswordProtectedDialog: React.FC<PasswordProtectedDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  correctPassword
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = () => {
    if (password === correctPassword) {
      setError('');
      setPassword('');
      setAttempts(0);
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setAttempts(prev => prev + 1);
      setPassword('');
      
      if (attempts >= 2) {
        setTimeout(() => {
          onClose();
          setAttempts(0);
          setError('');
        }, 1000);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setAttempts(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password..."
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!password}>
              Access
            </Button>
          </div>
          
          {attempts > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Attempts: {attempts}/3
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};