import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { EventForm } from '@/components/EventForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
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

const EditEvent = () => {
  const { clubId, eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

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
    status: 'pending',
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

  const formatDateTimeForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;
      setIsFetching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch event data');
        const data = await res.json();
        
        setEventData({
          ...data,
          startDateTime: formatDateTimeForInput(data.startDateTime),
          endDateTime: formatDateTimeForInput(data.endDateTime),
          registrationDeadline: formatDateTimeForInput(data.registrationDeadline),
        });
        setContactPersons(data.contactPersons?.map((cp: any) => ({...cp, id: cp._id})) || []);
        if (data.posterImage) {
          setPosterImageId(data.posterImage);
          setPosterPreview(`${API_BASE_URL}/api/images/${data.posterImage}`);
        }
        if (data.qrCodeImage) {
          setQrCodeImageId(data.qrCodeImage);
          setQrCodePreview(`${API_BASE_URL}/api/images/${data.qrCodeImage}`);
        }
      } catch (error) {
        toast({ title: "Error", description: "Could not load event data for editing.", variant: "destructive" });
        navigate(`/club/${clubId}`);
      } finally {
        setIsFetching(false);
      }
    };
    fetchEventData();
  }, [eventId, clubId, token, navigate]);

  const handleImageUpload = async (file: File, type: 'poster' | 'qr') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'poster') setPosterPreview(reader.result as string);
      else setQrCodePreview(reader.result as string);
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
      if (type === 'poster') setPosterImageId(data.fileId);
      if (type === 'qr') setQrCodeImageId(data.fileId);
    } catch (err) {
      toast({ title: "Image Upload Failed", variant: "destructive" });
    }
  };

const handleUpdate = async () => {
  setIsLoading(true);

  // Required fields check
  if (!eventData.name || !eventData.description || !eventData.startDateTime || !eventData.endDateTime || !eventData.eventType || !eventData.eventCategory || !eventData.venue || !eventData.mode) {
    toast({
      title: "Missing Required Fields",
      description: "Please fill in all mandatory fields (Name, Description, Type, Category, Venue, Mode, Dates).",
      variant: "destructive",
    });
    setIsLoading(false);
    return;
  }

  // Prepare payload for backend
  const payload = {
    name: eventData.name,
    description: eventData.description,
    eventType: eventData.eventType,
    eventCategory: eventData.eventCategory,
    startDateTime: new Date(eventData.startDateTime),
    endDateTime: new Date(eventData.endDateTime),
    registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : null,
    venue: eventData.venue,
    mode: eventData.mode,
    requiresFee: eventData.requiresFee,
    feeAmount: eventData.requiresFee ? Number(eventData.feeAmount) : 0,
    maxParticipants: Number(eventData.maxParticipants) || 0,
    totalSeats: Number(eventData.totalSeats) || 0,
    eligibility: eventData.eligibility || "",
    registrationLink: eventData.registrationLink || "",
    enableAttendance: eventData.enableAttendance || false,
    requireODApproval: eventData.requireODApproval || false,
    themeColor: eventData.themeColor,
    posterImage: posterImageId,
    qrCodeImage: qrCodeImageId,
    contactPersons: contactPersons.map(({ name, phone, designation, whatsappLink }) => ({
      name, phone, designation, whatsappLink,
    })),
    tags: eventData.tags || [],
  };

  console.log("Updating event with payload:", payload); // Debugging

  try {
    const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Backend Error:", errorData);
      throw new Error(errorData.error || JSON.stringify(errorData));
    }

    // Invalidate cache
    await queryClient.invalidateQueries({ queryKey: ["events", clubId] });
    await queryClient.invalidateQueries({ queryKey: ["event", eventId] });

    toast({
      title: "Event Updated!",
      description: "Your event has been successfully updated.",
    });
    navigate(`/club/${clubId}/event/${eventId}`);
  } catch (error) {
    toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
  } finally {
    setIsLoading(false);
  }
};


  if (isFetching) {
    return <div className="flex min-h-screen items-center justify-center">Loading event for editing...</div>;
  }

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
              onClick={() => navigate(`/club/${clubId}/event/${eventId}`)} 
              className="mb-6 hover:bg-primary/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Event Management
            </Button>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Edit Event
                </h1>
                <p className="text-muted-foreground">Modify the details of your event.</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleUpdate} disabled={isLoading} className="bg-gradient-to-r from-primary to-secondary">
                  <Send className="mr-2 h-4 w-4" />
                  Update Event
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
            <Button variant="outline" onClick={() => navigate(`/club/${clubId}/event/${eventId}`)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading} className="bg-gradient-to-r from-primary to-secondary">
              <Send className="mr-2 h-4 w-4" />
              Update Event
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditEvent;