import { Calendar, MapPin, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface EventCardProps {
  _id: string;
  title: string;
  club: string;
  date: string;
  time: string;
  venue: string;
  image: string;
  onRegister: () => void;
  isRegistered: boolean;
}

export const EventCard = ({ _id, title, club, date, time, venue, image, onRegister, isRegistered }: EventCardProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:shadow-elevated transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
          <p className="text-white/90 text-sm">{club}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            <span>{date} • {time}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 text-accent" />
            <span>{venue}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {isAuthenticated ? (
            isRegistered ? (
              <Button disabled className="w-full" size="sm">
                <Ticket className="mr-2 h-4 w-4" />
                Registered
              </Button>
            ) : (
              <Button className="w-full" size="sm" onClick={onRegister}>
                Register
              </Button>
            )
          ) : (
            <Button className="w-full" size="sm" onClick={() => navigate('/login')}>
              Login to Register
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/event/${_id}`)}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
};

export const EventCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </Card>
  );
};
