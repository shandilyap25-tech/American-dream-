import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  updateDoc,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';

export interface Property {
  id: string;
  propertyName: string;
  location: string;
  type: 'retail' | 'luxury' | 'dining' | 'entertainment';
  sizeRange: string;
  priceRange: string;
  description: string;
  features: string[];
  images: string[];
  available: boolean;
  createdAt: Timestamp;
}

export interface LeasingCall {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  businessType: string;
  preferredPropertyType: string;
  spaceRequired: string;
  budget: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: 'pending' | 'contacted' | 'closed';
  createdAt?: Timestamp;
}

// ----------------------------------------
// 1. EXPLORE PROPERTY (DATA SYSTEM)
// ----------------------------------------

export const fetchProperties = async (filters?: {
  type?: string;
  search?: string;
  lastDoc?: any;
  pageSize?: number;
}) => {
  const propertiesRef = collection(db, 'properties');
  const constraints = [orderBy('createdAt', 'desc')] as any[];

  if (filters?.type && filters.type !== 'all') {
    constraints.push(where('type', '==', filters.type));
  }

  if (filters?.pageSize) {
    constraints.push(limit(filters.pageSize));
  }

  if (filters?.lastDoc) {
    constraints.push(startAfter(filters.lastDoc));
  }

  const q = query(propertiesRef, ...constraints);
  const snapshot = await getDocs(q);
  
  let properties = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Property[];

  // Client-side search (Firestore doesn't support partial string match well natively)
  if (filters?.search) {
    const searchLow = filters.search.toLowerCase();
    properties = properties.filter(p => 
      p.propertyName.toLowerCase().includes(searchLow) || 
      p.location.toLowerCase().includes(searchLow)
    );
  }

  return {
    properties,
    lastDoc: snapshot.docs[snapshot.docs.length - 1]
  };
};

export const getPropertyById = async (id: string) => {
  const docRef = doc(db, 'properties', id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Property;
  }
  return null;
};

// ----------------------------------------
// 2. BOOK A LEASING CALL (FORM SYSTEM)
// ----------------------------------------

export const submitLeasingCall = async (data: Omit<LeasingCall, 'status' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'leasingCalls'), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    // SIMULATED NOTIFICATION
    console.log(`[Notification] New Leasing Request from ${data.fullName} (${data.companyName})`);
    console.log(`[Email Simulation] To: ${data.email} - "Your leasing request has been received. Our team will contact you shortly."`);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error submitting leasing call:", error);
    throw error;
  }
};

// ----------------------------------------
// 3. ADMIN PANEL FEATURES
// ----------------------------------------

export const fetchLeasingCalls = async (filters?: { status?: string, propertyType?: string }) => {
  const callsRef = collection(db, 'leasingCalls');
  const constraints = [orderBy('createdAt', 'desc')] as any[];
  
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  if (filters?.propertyType) constraints.push(where('preferredPropertyType', '==', filters.propertyType));

  const q = query(callsRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LeasingCall[];
};

export const updateCallStatus = async (id: string, status: LeasingCall['status']) => {
  const docRef = doc(db, 'leasingCalls', id);
  await updateDoc(docRef, { status });
};
