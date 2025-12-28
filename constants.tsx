
import { Patient, DICOMSeries, Activity, Site, Subject, YearCurriculum, EducationFile, Contribution, LeisureEvent, LeisureFund, LeisureContribution, Message, Module, AcademicItem } from './types';

export const MOCK_PATIENT: Patient = {
  id: '12345678',
  name: 'Doe, John',
  dob: '01/01/1980',
  study: 'MRI Head w/ Contrast',
  date: 'May 15, 2023 • 14:30'
};

export const MOCK_SERIES: DICOMSeries[] = [
  {
    id: 's1',
    title: 'Sag T1',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCarJBcWiBhLik93t626T7QagWHg-MZG29MKu5LfyojfiOcPmWKfbcw_r9e_WHDglmsPnPM7aaCWDEqgk3pxQXoKF_HEfEgyMN9OKG5Pa9mHb3LSgsLi4fHgi_easTF8QOxOz9-Etjd4cwzIttq_46c8dva778hHKt7y4-r3tRTHt7YMSoKJ968bX9ZHzno_fHcK-hoPNZexLAgz2NFGALxWyh5ayq8-9g0jGAnpGU_ZcXigV8CUfc27nCVpAo65iGJvxszl6BI1qM',
    count: 24,
    current: 1
  },
  {
    id: 's2',
    title: 'Axial T2',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA88yKcLq9YW9B-ajFnr4E57koipFSyrgQ1tlANBiSOtw0xzk5CXFYywH2LW5XZSqQAyR4EQqYiuF9ahi5yoGCXzKnUS13W8_oBJqhH-AT0WmWEZjT2QvOMqgFrSpHSwOyA0fLmbfeKJY879DmSYcTKCC0bbkf5p_KRKM_llDzgIYvvrvJN_Dj6cpA-VgIafCJXXBpM56bq-FuYee-ko8yEEfY8YtZh5x2VOvaryu8ta1W1gktCLL6T5vdUfgy9928P50ExgA-4HOk',
    count: 30,
    current: 12
  }
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', title: 'Nouveau cours disponible', description: 'Le module "IRM Cérébrale" a été ajouté.', time: 'Il y a 2 heures', type: 'course' }
];

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: 'c1', contributorName: 'Koffi Afi', contributorType: 'Resident', amount: 5000, date: '10/02/2025', month: 'Février', reason: 'Mensualité' },
  { id: 'c2', contributorName: 'Labo BioPlus', contributorType: 'Partenaire', amount: 150000, date: '11/02/2025', month: 'Février', reason: 'Don' },
  { id: 'c3', contributorName: 'Amewou Kossi', contributorType: 'Resident', amount: 50000, date: '12/02/2025', month: 'Janvier', reason: 'Cotisation Annuelle' }
];

export const MOCK_LEISURE: LeisureEvent[] = [
  {
    id: 'l1',
    title: 'Excursion aux Cascades de Kpalimé',
    type: 'voyage',
    date: '15/04/2025',
    location: 'Kpalimé, Togo',
    description: 'Randonnée dans la forêt d\'Agou, visite des cascades et dégustation de produits locaux.',
    costPerPerson: 15000,
    maxParticipants: 40,
    registeredParticipants: 28,
    pendingResidents: ['Dr. Amavi K.', 'Dr. Lawson T.'],
    status: 'open',
    imageUrl: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 'l2',
    title: 'Pique-nique Royal à Agbodrafo',
    type: 'pique-nique',
    date: '20/03/2025',
    location: 'Lac Togo, Agbodrafo',
    description: 'Barbecue au bord de l\'eau, traversée en pirogue vers Togoville et détente.',
    costPerPerson: 5000,
    registeredParticipants: 35,
    pendingResidents: [],
    status: 'open',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000'
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'Dr. Lawson',
    role: 'Chef de Service',
    subject: 'Alerte : Modification Planning des Gardes',
    content: 'Chers résidents, suite à un événement imprévu, le planning des gardes du CHU Campus pour le week-end du 22 février a été modifié. Merci de consulter la nouvelle grille affichée au secrétariat ou de contacter le major.',
    timestamp: 'Il y a 15 min',
    priority: 'urgent',
    read: false
  },
  {
    id: 'm2',
    sender: 'Bureau AMIS-RIM',
    role: 'Secrétariat National',
    subject: 'Clôture des Cotisations Voyage Kpalimé',
    content: 'Nous vous informons que les inscriptions pour le voyage à Kpalimé seront clôturées ce vendredi à 18h. Veuillez régulariser vos versements dans la section Loisir avant cette échéance pour garantir votre place.',
    timestamp: 'Il y a 2 heures',
    priority: 'important',
    read: false
  },
  {
    id: 'm3',
    sender: 'Pr. Agbeko',
    role: 'Coordinateur Pédagogique',
    subject: 'Mise en ligne Module IRM Prostate',
    content: 'Le support de cours sur l\'imagerie multiparamétrique de la prostate (Score PI-RADS v2.1) est désormais disponible dans votre espace Education. Bonne lecture.',
    timestamp: 'Hier',
    priority: 'info',
    read: true
  }
];

export const MOCK_LEISURE_FUNDS: LeisureFund[] = [
  { id: 'f1', title: 'Caisse Voyage Kpalimé', targetAmount: 600000, currentAmount: 420000, type: 'voyage' },
  { id: 'f2', title: 'Caisse Pique-nique Lac Togo', targetAmount: 200000, currentAmount: 175000, type: 'pique-nique' },
  { id: 'f3', title: 'Fonds Gala 2025', targetAmount: 2500000, currentAmount: 850000, type: 'fete' }
];

export const MOCK_LEISURE_CONTRIBUTIONS: LeisureContribution[] = [
  { id: 'lc1', fundId: 'f1', residentName: 'Koffi Mensah', amount: 15000, date: '05/02/2025' },
  { id: 'lc2', fundId: 'f1', residentName: 'Afi Dogbe', amount: 15000, date: '06/02/2025' },
  { id: 'lc3', fundId: 'f2', residentName: 'Kossi Amewou', amount: 5000, date: '07/02/2025' },
  { id: 'lc4', fundId: 'f3', residentName: 'Dr. Lawson', amount: 50000, date: '10/02/2025' }
];

export const MOCK_SITES: Site[] = [
  { 
    id: '1', 
    name: 'CHU Campus', 
    type: 'CHU', 
    supervisor: 'Dr. Kokou MENSAH', 
    duration: '6 mois', 
    equipment: ['IRM', 'Scanner', 'Echo'], 
    capacity: '3 places', 
    status: 'occupied',
    residents: []
  }
];

const sharedFiles: EducationFile[] = [
  { id: 'f1', name: 'Anatomie Thorax.pdf', type: 'pdf', date: '12/10/2024', size: '4.2 MB', author: 'Pr. Agbeko' }
];

const mockModules: Module[] = [
  { id: 'mod1', name: 'Sémiologie Pulmonaire', description: 'Étude des opacités et clartés.', files: sharedFiles },
  { id: 'mod2', name: 'Pathologie Interstitielle', description: 'Lignes de Kerley et verre dépoli.', files: sharedFiles }
];

export const MOCK_CURRICULUM: YearCurriculum[] = [
  {
    year: 1,
    subjects: [
      { id: 's1_1', name: 'Radiologie Thoracique', description: 'Bases de l\'imagerie thoracique.', modules: mockModules },
      { id: 's1_2', name: 'Radiologie Ostéo-Articulaire', description: 'Fractures et luxations.', modules: mockModules }
    ]
  },
  {
    year: 2,
    subjects: [
      { id: 's2_1', name: 'Neuro-Radiologie', description: 'IRM et TDM cérébral.', modules: mockModules }
    ]
  }
];

export const MOCK_STAFF_MODULES: Module[] = [
  { id: 'stmod1', name: 'Staff Urgences Abdominales', description: 'Cas cliniques du CHU SO.', files: sharedFiles },
  { id: 'stmod2', name: 'Staff Imagerie Pédiatrique', description: 'Invagination intestinale aiguë.', files: sharedFiles }
];

export const MOCK_EPU: AcademicItem[] = [
  { id: 'epu1', name: 'EPU Cardio-Vasculaire 2024', description: 'Focus sur le Score Calcique.', modules: mockModules },
  { id: 'epu2', name: 'EPU Gynéco-Obstétrique', description: 'Echographie pelvienne experte.', modules: mockModules }
];

export const MOCK_DIU: AcademicItem[] = [
  { id: 'diu1', name: 'DIU Imagerie de la Femme', description: 'Sénologie et Pelvis.', modules: mockModules }
];
