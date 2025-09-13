import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatDuration(startTime: Date, endTime?: Date): string {
  const end = endTime || new Date();
  const diffMs = end.getTime() - startTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  return `${diffMins}:${diffSecs.toString().padStart(2, '0')}`;
}

export function getSessionStatus(session: {
  isActive: boolean;
  startTime?: Date | null;
  endTime?: Date | null;
}): 'pending' | 'active' | 'completed' {
  if (!session.startTime) return 'pending';
  if (session.isActive && !session.endTime) return 'active';
  return 'completed';
}

export function validateSessionCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}