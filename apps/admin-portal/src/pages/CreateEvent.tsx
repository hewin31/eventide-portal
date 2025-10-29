import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { EventForm } from '@/components/EventForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
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
    teamSize: 1, // Default to 1 for individual events
    totalCapacity: '',
    eligibility: '',
    registrationLink: '',
    enableAttendance: false,
    requireODApproval: false,
    status: 'pending', // Default status
    themeColor: '#3b82f6',
    tags: [],
  });

  const [posterImageId, setPosterImageId] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');
  const [qrCodeImageId, setQrCodeImageId] = useState<string | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string>('');
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
    { id: '1', name: '', phone: '', designation: '', whatsappLink: '' }
  ]);

  const getDraftKey = useCallback(() => {
    if (!user?.id || !clubId) return null;
    return `event-draft-${user.id}-${clubId}`;
  }, [user?.id, clubId]);

  const handleSaveDraft = () => {
    const draftData = {
      eventData,
      posterImageId,
      posterPreview,
      qrCodeImageId,
      qrCodePreview,
      contactPersons,
    };
    const draftKey = getDraftKey();
    if (!draftKey) return; // Should not happen if user and club are loaded
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    toast.success('Draft Saved Locally!', {
      description: 'Your event progress has been saved in your browser.',
    });
  };

  useEffect(() => {
    const draftKey = getDraftKey();
    if (!draftKey) return;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      const loadDraft = () => {
        const parsedDraft = JSON.parse(savedDraft);
        setEventData(parsedDraft.eventData || eventData);
        setPosterImageId(parsedDraft.posterImageId || null);
        setPosterPreview(parsedDraft.posterPreview || '');
        setQrCodeImageId(parsedDraft.qrCodeImageId || null);
        setQrCodePreview(parsedDraft.qrCodePreview || '');
        setContactPersons(parsedDraft.contactPersons || contactPersons);
      };
      toast.info('You have a saved draft for this event.', {
        action: { label: 'Restore', onClick: () => loadDraft() },
        duration: 10000,
      });
    }
  }, [getDraftKey]); // Re-run if the key changes (user or club)

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

  const handleSubmit = async () => {
    setIsLoading(true);

    const requiredFields = [
      'name', 'description', 'eventType', 'eventCategory',
      'startDateTime', 'endDateTime', 'venue', 'mode', 'teamSize'
    ];
    const missingFields = requiredFields.filter(field => !eventData[field as keyof typeof eventData] && eventData[field as keyof typeof eventData] !== 0);
    if (missingFields.length > 0) {
      toast.error('Missing Required Fields', {
        description: `Please fill in: ${missingFields.join(', ')}`,
      });
      setIsLoading(false);
      return;
    }

    if (eventData.requiresFee && !eventData.feeAmount) {
      toast.error('Fee Amount Required', {
        description: 'Please specify the fee amount when registration fee is required.',
      });
      setIsLoading(false);
      return;
    }

    const contactErrors = contactPersons.some(
      (cp) => !cp.name || !cp.phone || !cp.whatsappLink
    );

    if (contactErrors) {
      toast.error('Contact Information Incomplete', {
        description: 'Please ensure all contact persons have a name, phone number, and WhatsApp link.',
      });
      setIsLoading(false);
      return;
    }

    if (!posterImageId) {
      toast.error('Poster Image Required', {
        description: 'Please upload an event poster before publishing.',
      });
      setIsLoading(false);
      return;
    }

    const payload = {
      name: eventData.name,
      description: eventData.description,
      eventType: eventData.eventType,
      eventCategory: eventData.eventCategory,
      startDateTime: eventData.startDateTime ? new Date(eventData.startDateTime) : null,
      endDateTime: eventData.endDateTime ? new Date(eventData.endDateTime) : null,
      registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : null,
      venue: eventData.venue,
      mode: eventData.mode,
      requiresFee: eventData.requiresFee,
      feeAmount: eventData.requiresFee ? Number(eventData.feeAmount) : 0,
      teamSize: Number(eventData.teamSize) || 1,
      totalCapacity: eventData.totalCapacity ? Number(eventData.totalCapacity) : null,
      eligibility: eventData.eligibility || '',
      registrationLink: eventData.registrationLink || '',
      enableAttendance: eventData.enableAttendance || false,
      requireODApproval: eventData.requireODApproval || false,
      themeColor: eventData.themeColor,
      posterImage: posterImageId,
      qrCodeImage: qrCodeImageId,
      contactPersons: contactPersons.map(({ name, phone, designation, whatsappLink }) => ({
        name, phone, designation, whatsappLink,
      })),
      clubId,
      tags: eventData.tags || [],
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to publish event');

      // Clear the draft from local storage on successful submission
      const draftKey = getDraftKey();
      if (draftKey) localStorage.removeItem(draftKey);

      await queryClient.invalidateQueries({ queryKey: ['events', clubId] });
      toast.success('Event Submitted!', {
        description: (user?.role === 'coordinator' ? 'Your event has been published immediately.' : 'Your event is now pending approval.'),
      });
      navigate(`/club/${clubId}`);
    } catch (error) {
      toast.error('Submission Failed', { description: (error as Error).message });
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
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Draft
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isLoading} className="bg-gradient-to-r from-primary to-secondary">
                      <Send className="mr-2 h-4 w-4" />
                      {user?.role === 'coordinator' ? 'Publish Immediately' : 'Submit for Approval'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you ready to submit?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will {user?.role === 'coordinator' ? 'publish the event immediately' : 'submit the event for approval'}. You can still edit the details later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmit}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Draft
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isLoading} className="bg-gradient-to-r from-primary to-secondary">
                  <Send className="mr-2 h-4 w-4" />
                  {user?.role === 'coordinator' ? 'Publish Immediately' : 'Submit for Approval'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you ready to submit?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will {user?.role === 'coordinator' ? 'publish the event immediately' : 'submit the event for approval'}. You can still edit the details later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateEvent;
