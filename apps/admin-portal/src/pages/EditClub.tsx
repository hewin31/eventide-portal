import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Upload, Send, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

const EditClub = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageId, setImageId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchClubData = async () => {
      if (!clubId) return;
      setIsFetching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/clubs/${clubId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch club data');
        const data = await res.json();
        setName(data.name);
        setDescription(data.description);
        if (data.imageUrl) {
          setImageId(data.imageUrl);
          setImagePreview(`${API_BASE_URL}/api/images/${data.imageUrl}`);
        }
      } catch (error) {
        toast.error('Could not load club data for editing.');
        navigate(`/club/${clubId}`);
      } finally {
        setIsFetching(false);
      }
    };
    fetchClubData();
  }, [clubId, token, navigate]);

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setImageId(data.fileId);
      toast.success('Image uploaded successfully!');
    } catch (err) {
      toast.error('Image upload failed.');
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    if (!name || !description) {
      toast.error('Name and description are required.');
      setIsLoading(false);
      return;
    }

    const payload = {
      name,
      description,
      imageUrl: imageId,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/clubs/${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || 'Failed to update club');
      }

      await queryClient.invalidateQueries({ queryKey: ['club', clubId] });
      toast.success('Club details updated successfully!');
      navigate(`/club/${clubId}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="flex min-h-screen items-center justify-center">Loading club details...</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(`/club/${clubId}`)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Club Workspace
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Edit Club Information</CardTitle>
              <CardDescription>Update the name, description, and image for your club.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Club Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poster">Club Image</Label>
                <div className="mt-1.5">
                  <label htmlFor="poster" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Club" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">Click to upload an image</p>
                      </div>
                    )}
                    <input id="poster" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-secondary">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Update Club Info
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to update the club information? This will be visible to all club members.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUpdate}>Update</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EditClub;