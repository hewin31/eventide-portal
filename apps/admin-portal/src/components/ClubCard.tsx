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
    <Card className="overflow-hidden transition-all duration-500 ease-out cursor-pointer group border-primary/20 bg-gradient-to-br from-card to-card/90 shadow-xl hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-3 animate-bounce-in" onClick={() => onOpen(club.id)}>
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
    <Card className="overflow-hidden transition-all duration-300 cursor-pointer group border-0 bg-card shadow-lg hover:shadow-primary/30 hover:-translate-y-2" onClick={() => onOpen(club.id)}>
      <div className="relative h-48 overflow-hidden">
        {club.imageUrl ? (
          <img
            src={`${API_BASE_URL}/api/images/${club.imageUrl}`}
            alt={club.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse">
            <Users className="h-20 w-20 text-primary opacity-50 transition-transform duration-300 group-hover:scale-110" />
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <Users className="h-20 w-20 text-primary opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-all duration-300 group-hover:from-black/90 group-hover:via-black/40" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold font-poppins text-white drop-shadow-lg transition-all duration-300 group-hover:translate-y-[-2px]">
            {club.name}
          </h3>
        </div>
      </div>
      <CardContent className="p-6 space-y-4">
        <p className="text-muted-foreground line-clamp-2 min-h-[3rem] transition-colors duration-300 group-hover:text-foreground/80">
          {club.description || 'Club description goes here'}
        </p>
        <Button className="w-full group-hover:shadow-xl group-hover:shadow-primary/40 transition-all duration-300 font-semibold">
        <Button className="w-full group-hover:shadow-lg group-hover:shadow-primary/40 transition-all duration-300 bg-gradient-to-r from-primary to-secondary text-white">
          Open Workspace
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </CardContent>
    </Card>
  );
};
