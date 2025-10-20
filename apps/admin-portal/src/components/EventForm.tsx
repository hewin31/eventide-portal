import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  DollarSign,
  Image as ImageIcon,
  MapPin,
  Plus,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';

interface ContactPerson {
  id: string;
  name: string;
  phone: string;
  designation: string;
  whatsappLink: string;
}

interface EventFormProps {
  eventData: any;
  setEventData: React.Dispatch<React.SetStateAction<any>>;
  posterPreview: string;
  qrCodePreview: string;
  handleImageUpload: (file: File, type: 'poster' | 'qr') => void;
  contactPersons: ContactPerson[];
  setContactPersons: React.Dispatch<React.SetStateAction<ContactPerson[]>>;
  clubName: string;
}

export const EventForm = ({
  eventData,
  setEventData,
  posterPreview,
  qrCodePreview,
  handleImageUpload,
  contactPersons,
  setContactPersons,
  clubName,
}: EventFormProps) => {
  const addContactPerson = () => {
    setContactPersons([
      ...contactPersons,
      { id: Date.now().toString(), name: '', phone: '', designation: '', whatsappLink: '' },
    ]);
  };

  const removeContactPerson = (id: string) => {
    setContactPersons(contactPersons.filter((cp) => cp.id !== id));
  };

  const updateContactPerson = (id: string, field: keyof ContactPerson, value: string) => {
    setContactPersons(
      contactPersons.map((cp) => (cp.id === id ? { ...cp, [field]: value } : cp))
    );
  };

  return (
    <Accordion type="multiple" defaultValue={['info', 'schedule', 'registration']} className="space-y-4">
      {/* 1. Event Information */}
      <AccordionItem value="info" className="border rounded-lg bg-card">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">Event Information</h3>
              <p className="text-sm text-muted-foreground">Basic details about your event</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={eventData.name}
                onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                placeholder="e.g., Annual Tech Fest"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                placeholder="Enter event overview, purpose, rules, etc."
                className="mt-1.5 min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventType">Event Type *</Label>
                <Select
                  value={eventData.eventType}
                  onValueChange={(value) => setEventData({ ...eventData, eventType: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="non-technical">Non-Technical</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="eventCategory">Event Category *</Label>
                <Select
                  value={eventData.eventCategory}
                  onValueChange={(value) => setEventData({ ...eventData, eventCategory: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="club">Club</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="clubName">Club Name</Label>
              <Input id="clubName" value={clubName} disabled className="mt-1.5 bg-muted" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 2. Schedule & Venue */}
      <AccordionItem value="schedule" className="border rounded-lg bg-card">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-secondary" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">Schedule & Venue</h3>
              <p className="text-sm text-muted-foreground">Date, time, and location details</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDateTime">Start Date & Time *</Label>
                <Input
                  id="startDateTime"
                  type="datetime-local"
                  value={eventData.startDateTime}
                  onChange={(e) => setEventData({ ...eventData, startDateTime: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="endDateTime">End Date & Time *</Label>
                <Input
                  id="endDateTime"
                  type="datetime-local"
                  value={eventData.endDateTime}
                  onChange={(e) => setEventData({ ...eventData, endDateTime: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="registrationDeadline">Registration Deadline</Label>
              <Input
                id="registrationDeadline"
                type="datetime-local"
                value={eventData.registrationDeadline}
                onChange={(e) => setEventData({ ...eventData, registrationDeadline: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="venue">Venue / Location *</Label>
                <Input
                  id="venue"
                  value={eventData.venue}
                  onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                  placeholder="e.g., Auditorium, Lab 3"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="mode">Mode *</Label>
                <Select
                  value={eventData.mode}
                  onValueChange={(value) => setEventData({ ...eventData, mode: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 3. Registration Fee */}
      <AccordionItem value="fee" className="border rounded-lg bg-card">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">Registration Fee</h3>
              <p className="text-sm text-muted-foreground">Fee and payment details</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="requiresFee" className="text-base font-medium">
                  Is Registration Fee Required?
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable if participants need to pay a fee
                </p>
              </div>
              <Switch
                id="requiresFee"
                checked={eventData.requiresFee}
                onCheckedChange={(checked) => setEventData({ ...eventData, requiresFee: checked })}
              />
            </div>
            {eventData.requiresFee && (
              <>
                <div>
                  <Label htmlFor="feeAmount">Fee Amount (₹) *</Label>
                  <Input
                    id="feeAmount"
                    type="number"
                    value={eventData.feeAmount}
                    onChange={(e) => setEventData({ ...eventData, feeAmount: e.target.value })}
                    placeholder="100"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="qrCode">GPay QR Code (Optional)</Label>
                  <div className="mt-1.5">
                    <label
                      htmlFor="qrCode"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      {qrCodePreview ? (
                        <img src={qrCodePreview} alt="QR Code" className="h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload QR code</p>
                        </div>
                      )}
                      <input
                        id="qrCode"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'qr')}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 4. Registration & Eligibility */}
      <AccordionItem value="registration" className="border rounded-lg bg-card">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">Registration & Eligibility</h3>
              <p className="text-sm text-muted-foreground">Participant requirements and limits</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxParticipants">Max Participants / Team Size *</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={eventData.maxParticipants}
                  onChange={(e) => setEventData({ ...eventData, maxParticipants: e.target.value })}
                  placeholder="4"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="totalSeats">Total Seats / Capacity</Label>
                <Input
                  id="totalSeats"
                  type="number"
                  value={eventData.totalSeats}
                  onChange={(e) => setEventData({ ...eventData, totalSeats: e.target.value })}
                  placeholder="100"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="eligibility">Eligibility</Label>
              <Input
                id="eligibility"
                value={eventData.eligibility}
                onChange={(e) => setEventData({ ...eventData, eligibility: e.target.value })}
                placeholder="e.g., Open to all students of CSE Dept."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="registrationLink">External Registration Link</Label>
              <Input
                id="registrationLink"
                type="url"
                value={eventData.registrationLink}
                onChange={(e) => setEventData({ ...eventData, registrationLink: e.target.value })}
                placeholder="https://forms.google.com/..."
                className="mt-1.5"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 col-span-2">
              <div>
                <Label htmlFor="requireODApproval" className="text-base font-medium">
                  Require OD Approval?
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  If enabled, participants can request On-Duty status.
                </p>
              </div>
              <Switch
                id="requireODApproval"
                checked={eventData.requireODApproval}
                onCheckedChange={(checked) => setEventData({ ...eventData, requireODApproval: checked })}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 5. Organizers & Contact */}
      <AccordionItem value="contacts" className="border rounded-lg bg-card">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">Organizers & Contact Personnel</h3>
              <p className="text-sm text-muted-foreground">Add event coordinators</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-4 pt-4">
            {contactPersons.map((contact, index) => (
              <Card key={contact.id} className="p-4 bg-muted/30">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Contact Person {index + 1}</h4>
                  {contactPersons.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContactPerson(contact.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={contact.name}
                      onChange={(e) => updateContactPerson(contact.id, 'name', e.target.value)}
                      placeholder="John Doe"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Contact Number *</Label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => updateContactPerson(contact.id, 'phone', e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Designation / Role</Label>
                    <Input
                      value={contact.designation}
                      onChange={(e) => updateContactPerson(contact.id, 'designation', e.target.value)}
                      placeholder="e.g., Student Lead"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>WhatsApp Group Link *</Label>
                    <Input
                      value={contact.whatsappLink}
                      onChange={(e) => updateContactPerson(contact.id, 'whatsappLink', e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={addContactPerson}
              className="w-full hover:bg-primary/10 hover:border-primary transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Contact Person
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 6. Media & Branding */}
      <AccordionItem value="media" className="border rounded-lg bg-card">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-accent" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">Media & Branding</h3>
              <p className="text-sm text-muted-foreground">Event visuals and theme</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="poster">Event Poster (Main Image) *</Label>
              <div className="mt-1.5">
                <label
                  htmlFor="poster"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {posterPreview ? (
                    <img src={posterPreview} alt="Event Poster" className="h-full object-contain rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">Click to upload event poster</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input
                    id="poster"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'poster')}
                  />
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="themeColor">Theme Color</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <Input
                  id="themeColor"
                  type="color"
                  value={eventData.themeColor}
                  onChange={(e) => setEventData({ ...eventData, themeColor: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{eventData.themeColor}</span>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};