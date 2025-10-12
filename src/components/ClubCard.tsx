import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users } from 'lucide-react';
import { Club } from '@/contexts/AuthContext';

interface ClubCardProps {
  club: Club;
  onOpen: (clubId: string) => void;
}

export const ClubCard = ({ club, onOpen }: ClubCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => onOpen(club.id)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {club.name}
            </CardTitle>
            <CardDescription className="mt-2">
              {club.description || 'Club description goes here'}
            </CardDescription>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          Open Workspace
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
