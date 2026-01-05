
export interface Patient {
  id: string;
  name: string;
  dob: string;
  study: string;
  date: string;
}

export interface DICOMSeries {
  id: string;
  title: string;
  imageUrl: string;
  count: number;
  current: number;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'course' | 'validation' | 'payment';
}

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  year: string | null;
  hospital: string | null;
  role: 'admin' | 'resident';
  status: string;
}

export interface Site {
  id: string;
  name: string;
  type: string;
  supervisor: string;
  duration: string;
  equipment: string[];
  capacity: string;
  status: 'available' | 'occupied' | 'full';
  address?: string;
  phone?: string;
  email?: string;
  residents: Resident[];
}

export interface Contribution {
  id: string;
  contributorName: string;
  contributorType: 'Resident' | 'Partenaire';
  amount: number;
  date: string;
  month: string;
  reason: string;
}

export interface LeisureContribution {
  id: string;
  fundId: string;
  residentName: string;
  amount: number;
  date: string;
}

export interface LeisureFund {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  type: 'voyage' | 'pique-nique' | 'fete';
  eventId?: string;
}
export interface LeisureParticipant {
  id: string;
  eventId: string;
  profileId: string;
  status: 'pending' | 'approved' | 'rejected';
  firstName: string;
  lastName: string;
}

export interface LeisureEvent {
  id: string;
  title: string;
  type: 'voyage' | 'pique-nique' | 'fete';
  date: string;
  eventDate?: string;
  location: string;
  description: string;
  costPerPerson: number;
  maxParticipants?: number;
  registeredParticipants: number;
  pendingResidents: string[]; // Liste des noms des résidents en attente
  status: 'planning' | 'open' | 'completed' | 'cancelled';
  imageUrl?: string;
  participants: LeisureParticipant[];
}

export interface EducationFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'ppt' | 'video';
  date: string;
  size: string;
  author?: string;
  url?: string;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  files: EducationFile[];
  subjectId?: string;
  category?: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  modules: Module[];
  year?: number;
  category?: string;
}

export interface YearCurriculum {
  year: number;
  subjects: Subject[];
}

export interface AcademicItem {
  id: string;
  name: string;
  description?: string;
  modules: Module[];
}

export interface Course {
  id: string;
  title: string;
  professor: string;
  date: string;
  downloads: number;
  hasFile: boolean;
  type: 'pdf' | 'none';
  year: number;
}

export interface Message {
  id: string;
  sender: string;
  role: string;
  subject: string;
  content: string;
  timestamp: string;
  priority: 'urgent' | 'important' | 'info';
  read: boolean;
  type?: 'broadcast' | 'alert' | 'general';
  createdAt?: string; // for sorting
  author?: string;
}

export interface Attendance {
  id: string;
  profileId: string;
  itemType: 'staff' | 'epu' | 'diu' | 'stage';
  itemId?: string;
  status: 'pending' | 'confirmed';
  createdAt: string;
}
