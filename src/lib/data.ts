
import { supabase } from './supabaseClient';

export type FileAttachment = {
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'excel' | 'other';
};

export const engineTypes = [
  "NIV KOM", "ARR CAT", "Bulls D9", "Bulls D11", "Camion ravitaillement GO CAT", 
  "Chargeuse 992K", "Chargeuse 994F", "NIV CAT", "Paydozer KOM", 
  "Sondeuse DKS", "Sondeuse SKF"
];

// Types matching the Supabase table structure
export type Workstation = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  created_at: string;
  image?: string;
  files?: FileAttachment[];
};

export type Standard = {
  id: string;
  name: string;
  category: string;
  version: string | null;
  description?: string | null;
  image?: string;
  files?: FileAttachment[];
  last_updated: string;
};

export interface CellData {
  content: string;
  colspan?: number;
  rowspan?: number;
  merged?: boolean;
  header?: string;
}

export interface TableData {
  rows: number;
  cols: number;
  data: Record<string, CellData>;
  headers?: string[];
}

export type Form = {
  id: string;
  name: string;
  last_updated: string;
  table_data?: TableData;
  files?: FileAttachment[];
};

// --- Analytics Types ---
export type AnalyticsEvent = {
    id?: number;
    created_at?: string;
    event_type: 'consultation' | 'form_filled';
    target_type: 'workstation' | 'standard' | 'form';
    target_id: string;
    target_details?: object;
};

export const getFileType = (file: File): FileAttachment['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) return 'excel';
    return 'other';
}

// --- Analytics Functions ---
export async function logAnalyticsEvent(event: AnalyticsEvent): Promise<boolean> {
    const { error } = await supabase.from('analytics_events').insert([event]);
    if (error) {
        console.error("Error logging analytics event:", error);
        return false;
    }
    return true;
}


// --- Workstation Functions ---
export async function getWorkstations(): Promise<Workstation[]> {
  const { data, error } = await supabase.from('workstations').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching workstations:", error);
    throw error;
  }
  return data || [];
}

export async function getWorkstationsCount(): Promise<number> {
  const { count, error } = await supabase.from('workstations').select('*', { count: 'exact', head: true });
  if (error) {
    console.error("Error counting workstations:", error);
    return 0;
  }
  return count || 0;
}

export async function addWorkstation(workstation: Omit<Workstation, 'id' | 'created_at'>): Promise<boolean> {
  const { error } = await supabase.from('workstations').insert([workstation]);
  if (error) {
    console.error("Error adding workstation:", error);
    return false;
  }
  return true;
}

export async function getWorkstationById(id: string): Promise<Workstation | undefined> {
  const { data, error } = await supabase.from('workstations').select('*').eq('id', id).single();
  if (error) {
    console.error(`Error fetching workstation ${id}:`, error);
    return undefined;
  }
  return data;
}

export async function updateWorkstation(id: string, updates: Partial<Omit<Workstation, 'id' | 'created_at'>>): Promise<boolean> {
    const { error } = await supabase.from('workstations').update(updates).eq('id', id);
    if (error) {
        console.error(`Error updating workstation ${id}:`, error);
        return false;
    }
    return true;
}

export async function deleteWorkstation(id: string): Promise<boolean> {
    const { error } = await supabase.from('workstations').delete().eq('id', id);
    if (error) {
        console.error(`Error deleting workstation ${id}:`, error);
        return false;
    }
    return true;
}


// --- Standard Functions ---
export async function getStandards(): Promise<Standard[]> {
  const { data, error } = await supabase.from('standards').select('*').order('last_updated', { ascending: false });
  if (error) {
    console.error("Error fetching standards:", error);
    throw error;
  }
  return data || [];
}

export async function getStandardsCount(): Promise<number> {
  const { count, error } = await supabase.from('standards').select('*', { count: 'exact', head: true });
   if (error) {
    console.error("Error counting standards:", error);
    return 0;
  }
  return count || 0;
}

export async function addStandard(standard: Omit<Standard, 'id' | 'last_updated'>): Promise<boolean> {
  const { error } = await supabase.from('standards').insert([{ ...standard, last_updated: new Date().toISOString() }]);
  if (error) {
    console.error("Error adding standard:", error);
    return false;
  }
  return true;
}

export async function getStandardById(id: string): Promise<Standard | undefined> {
    const { data, error } = await supabase.from('standards').select('*').eq('id', id).single();
    if (error) {
        console.error(`Error fetching standard ${id}:`, error);
        return undefined;
    }
    return data;
}

export async function updateStandard(id: string, updates: Partial<Omit<Standard, 'id' | 'last_updated'>>): Promise<boolean> {
    const { error } = await supabase.from('standards').update({ ...updates, last_updated: new Date().toISOString() }).eq('id', id);
    if (error) {
        console.error(`Error updating standard ${id}:`, error);
        return false;
    }
    return true;
}

export async function deleteStandard(id: string): Promise<boolean> {
    const { error } = await supabase.from('standards').delete().eq('id', id);
     if (error) {
        console.error(`Error deleting standard ${id}:`, error);
        return false;
    }
    return true;
}

// --- Form Functions ---
export async function getForms(): Promise<Form[]> {
  const { data, error } = await supabase.from('forms').select('*').order('last_updated', { ascending: false });
  if (error) {
    console.error("Error fetching forms:", error);
    throw error;
  }
  return data || [];
}

export async function getFormsCount(): Promise<number> {
  const { count, error } = await supabase.from('forms').select('*', { count: 'exact', head: true });
  if (error) {
    console.error("Error counting forms:", error);
    return 0;
  }
  return count || 0;
}

export async function addForm(form: Omit<Form, 'id' | 'last_updated'>): Promise<boolean> {
    const { error } = await supabase.from('forms').insert([{ ...form, last_updated: new Date().toISOString() }]);
    if (error) {
        console.error("Error adding form:", error);
        return false;
    }
    return true;
}

export async function getFormById(id: string): Promise<Form | undefined> {
    const { data, error } = await supabase.from('forms').select('*').eq('id', id).single();
    if (error) {
        console.error(`Error fetching form ${id}:`, error);
        return undefined;
    }
    return data;
}

export async function updateForm(id: string, updates: Partial<Omit<Form, 'id' | 'last_updated'>>): Promise<boolean> {
    const { error } = await supabase.from('forms').update({ ...updates, last_updated: new Date().toISOString() }).eq('id', id);
    if (error) {
        console.error(`Error updating form ${id}:`, error);
        return false;
    }
    return true;
}

export async function deleteForm(id: string): Promise<boolean> {
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) {
        console.error(`Error deleting form ${id}:`, error);
        return false;
    }
    return true;
}
