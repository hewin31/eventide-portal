import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SignInRequiredProps {
  title?: string;
  description?: ReactNode;
  actionLabel?: string;
  className?: string;
}

export const SignInRequired = ({
  title = 'Sign in Required',
  description = 'Please sign in to continue.',
  actionLabel = 'Sign In',
  className,
}: SignInRequiredProps) => {
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen pb-20 md:pb-8 px-6 py-8 flex items-center justify-center ${className ?? ''}`}>
      <Card className="max-w-md w-full text-center p-8">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <User className="w-16 h-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{description}</p>
          <Button onClick={() => navigate('/login')} className="w-full">
            {actionLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
