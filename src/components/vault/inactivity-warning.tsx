'use client';

import { useTimeoutStore } from '@/store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Timer, LogOut } from 'lucide-react';

export function InactivityWarning() {
  const { isWarning, countdown, resetTimer, triggerLogout } = useTimeoutStore();

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <Dialog open={isWarning} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDown={resetTimer}
        onKeyDown={resetTimer}
        onWheel={resetTimer}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-400">
            <Timer className="h-5 w-5" />
            Session Timeout Warning
          </DialogTitle>
          <DialogDescription>
            You&apos;ve been inactive for a while. You&apos;ll be automatically logged out in{' '}
            <span className="font-mono font-bold text-foreground">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>{' '}
            for security.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 60) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Move your mouse, type, or click anywhere to stay logged in.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={triggerLogout}
            className="text-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout Now
          </Button>
          <Button onClick={resetTimer}>Stay Logged In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}