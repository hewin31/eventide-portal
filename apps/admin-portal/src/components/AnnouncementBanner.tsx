import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/utils';
import { Megaphone, X } from 'lucide-react';
import { Button } from './ui/button';

interface Announcement {
  _id: string;
  message: string;
}

async function fetchActiveAnnouncement(token: string | null): Promise<Announcement | null> {
  const res = await fetch(`${API_BASE_URL}/api/announcements/active`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch announcement');
  if (res.status === 204) return null;
  const data = await res.json();
  return data || null;
}

export const AnnouncementBanner = () => {
  const token = localStorage.getItem('token');
  const [isVisible, setIsVisible] = useState(true);

  const { data: announcement } = useQuery<Announcement | null>({
    queryKey: ['activeAnnouncement'],
    queryFn: () => fetchActiveAnnouncement(token),
    enabled: !!token, // Only run if user is logged in
  });

  if (!announcement || !isVisible) {
    return null;
  }

  return (
    <div className="relative bg-primary/10 text-primary-foreground p-3 text-center text-sm border-b-2 border-primary/20">
      <Megaphone className="inline-block mr-2 h-4 w-4" />
      <span className="font-medium">{announcement.message}</span>
      <Button variant="ghost" size="sm" className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setIsVisible(false)}><X className="h-4 w-4" /></Button>
    </div>
  );
};
