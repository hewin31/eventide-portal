import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { EventForm } from '@/components/EventForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface ContactPerson {
  id: string;
  name: string;
  phone: string;
  designation: string;
  whatsappLink: string;
}

const CreateEvent = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const [isLoading, setIsLoading] = useState(false);

  const club = user?.clubs.find(c => c.id === clubId);

  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    eventType: '',
    eventCategory: '',
    startDateTime: '',
    endDateTime: '',
    registrationDeadline: '',
    venue: '',
    mode: '',
    requiresFee: false,
    feeAmount: '',
    maxParticipants: '',
    totalSeats: '',
    eligibility: '',
    registrationLink: '',
    enableAttendance: false,
    requireODApproval: false,
    status: 'pending', // Default status
    themeColor: '#3b82f6',
  });

  const [posterImageId, setPosterImageId] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');
  const [qrCodeImageId, setQrCodeImageId] = useState<string | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string>('');
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
    { id: '1', name: '', phone: '', designation: '', whatsappLink: '' }
  ]);

  const handleImageUpload = async (file: File, type: 'poster' | 'qr') => {
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'poster') {
        setPosterPreview(reader.result as string);
      } else {
        setQrCodePreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload the file
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (type === 'poster') setPosterImageId(data.fileId);
      if (type === 'qr') setQrCodeImageId(data.fileId);
    } catch (err) {
      toast({ title: "Image Upload Failed", variant: "destructive" });
    }
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your event has been saved as draft.",
    });
  };

  const handlePublish = async () => {
    setIsLoading(true);
    // Validation
    if (!eventData.name || !eventData.description) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in the event name and description.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const payload = {
      ...eventData,
      posterImage: posterImageId, // Send the uploaded image ID
      qrCodeImage: qrCodeImageId,
      clubId,
      status: 'pending',
      contactPersons,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to publish event');

      await queryClient.invalidateQueries({ queryKey: ['events', clubId] });
      toast({ title: "Event Published!", description: "Your event is now live." });
      navigate(`/club/${clubId}`);
    } catch (error) {
      toast({ title: "Error", description: "Could not publish event.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!club) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Club Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/club/${clubId}`)} 
              className="mb-6 hover:bg-primary/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Club
            </Button>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Create New Event
                </h1>
                <p className="text-muted-foreground">Enter event details to publish it for student registration.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button onClick={handlePublish} disabled={isLoading} className="bg-gradient-to-r from-primary to-secondary">
                  <Send className="mr-2 h-4 w-4" />
                  Publish Event
                </Button>
              </div>
            </div>
          </div>

          {/* Form Sections */}
          <EventForm
            eventData={eventData}
            setEventData={setEventData}
            posterPreview={posterPreview}
            qrCodePreview={qrCodePreview}
            handleImageUpload={handleImageUpload}
            contactPersons={contactPersons}
            setContactPersons={setContactPersons}
            clubName={club.name}
          />

          {/* Bottom Actions */}
          <div className="mt-8 flex justify-end gap-3 pb-8">
            <Button variant="outline" onClick={() => navigate(`/club/${clubId}`)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button onClick={handlePublish} disabled={isLoading} className="bg-gradient-to-r from-primary to-secondary">
              <Send className="mr-2 h-4 w-4" />
              Publish Event
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateEvent;
