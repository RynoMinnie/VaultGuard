import { toast } from 'sonner';

let clearTimer: ReturnType<typeof setTimeout> | null = null;

export async function copyWithAutoClear(text: string, label?: string): Promise<void> {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label || 'Value'} copied — clears in 30s`);

    clearTimer = setTimeout(async () => {
      try {
        await navigator.clipboard.writeText('');
      } catch {
        // Clipboard clear failed silently — acceptable
      }
      clearTimer = null;
    }, 30_000);
  } catch {
    toast.error('Failed to copy to clipboard');
  }
}