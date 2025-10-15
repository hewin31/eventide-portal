import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users } from 'lucide-react';
import { Club } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/utils';

interface ClubCardProps {
  club: Club;
  onOpen: (clubId: string) => void;
}

export const ClubCard = ({ club, onOpen }: ClubCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer group border-0 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm" onClick={() => onOpen(club.id)}>
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
        {club.imageUrl ? (
          <img 
            src={`${API_BASE_URL}/api/images/${club.imageUrl}`} 
            alt={club.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30">
            <Users className="h-20 w-20 text-primary opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">
            {club.name}
          </h3>
        </div>
      </div>
      <CardContent className="p-6 space-y-4">
        <p className="text-muted-foreground line-clamp-2 min-h-[3rem]">
          {club.description || 'Club description goes here'}
        </p>
        <Button className="w-full group-hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
          Open Workspace
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};
