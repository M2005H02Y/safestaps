
import { supabase } from './supabaseClient';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';


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

export interface AnalyticsSummary {
  scansLastPeriod: number;
  standardsConsultationsLastPeriod: number;
  formsConsultationsLastPeriod: number;
  formsFilledLastPeriod: number;
  consultationsByEngine: { name: string; value: number }[];
  consultationsByStandard: { name: string; value: number }[];
  consultationsByForm: { name: string; value: number }[];
  consultationsByDayWorkstations: { name: string; value: number }[];
  consultationsByDayStandards: { name: string; value: number }[];
  consultationsByDayForms: { name: string; value: number }[];
}


export const getFileType = (file: File): FileAttachment['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) return 'excel';
    return 'other';
}

// Helper to create a daily summary from raw events
const summarizeDailyEvents = (events: { created_at: string }[], days: number): { name: string; value: number }[] => {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    const interval = eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(endDate) });

    const dailyCounts: Record<string, number> = interval.reduce((acc, date) => {
        const formattedDate = format(date, 'dd/MM');
        acc[formattedDate] = 0;
        return acc;
    }, {} as Record<string, number>);

    if (events) {
        for (const event of events) {
            const date = startOfDay(new Date(event.created_at));
            const formattedDate = format(date, 'dd/MM');
            if (formattedDate in dailyCounts) {
                dailyCounts[formattedDate]++;
            }
        }
    }
    
    return Object.entries(dailyCounts).map(([name, value]) => ({ name, value }));
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

export async function getAnalyticsSummary(days: number = 7): Promise<AnalyticsSummary> {
    const sinceDate = subDays(new Date(), days).toISOString();

    const [
        scans,
        standardsConsultations,
        formsConsultations,
        formsFilled,
        workstationEvents,
        standardEvents,
        formEvents,
        allStandards,
        allForms
    ] = await Promise.all([
        supabase.from('analytics_events').select('id', { count: 'exact' }).eq('event_type', 'consultation').gte('created_at', sinceDate),
        supabase.from('analytics_events').select('id', { count: 'exact' }).eq('event_type', 'consultation').eq('target_type', 'standard').gte('created_at', sinceDate),
        supabase.from('analytics_events').select('id', { count: 'exact' }).eq('event_type', 'consultation').eq('target_type', 'form').gte('created_at', sinceDate),
        supabase.from('analytics_events').select('id', { count: 'exact' }).eq('event_type', 'form_filled').gte('created_at', sinceDate),

        supabase.from('analytics_events').select('created_at, target_id, target_details').eq('event_type', 'consultation').eq('target_type', 'workstation').gte('created_at', sinceDate),
        supabase.from('analytics_events').select('created_at, target_id').eq('event_type', 'consultation').eq('target_type', 'standard').gte('created_at', sinceDate),
        supabase.from('analytics_events').select('created_at, target_id').eq('event_type', 'consultation').eq('target_type', 'form').gte('created_at', sinceDate),
        
        supabase.from('standards').select('id, name'),
        supabase.from('forms').select('id, name')
    ]);
    
    const errors = [scans.error, standardsConsultations.error, formsConsultations.error, formsFilled.error, workstationEvents.error, standardEvents.error, formEvents.error, allStandards.error, allForms.error].filter(Boolean);
    if (errors.length > 0) {
        console.error("Error fetching analytics summary:", errors);
        throw new Error("Failed to fetch analytics summary");
    }

    // Process consultations by engine type
    const engineCounts: Record<string, number> = {};
    if (workstationEvents.data) {
        for (const event of workstationEvents.data) {
            const details = event.target_details as { type?: string };
            if (details && details.type) {
                engineCounts[details.type] = (engineCounts[details.type] || 0) + 1;
            }
        }
    }
    const consultationsByEngine = Object.entries(engineCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Process consultations by standard
    const standardNameMap = new Map(allStandards.data?.map(s => [s.id, s.name]));
    const standardCounts: Record<string, number> = {};
    if (standardEvents.data) {
        for (const event of standardEvents.data) {
            const name = standardNameMap.get(event.target_id) || `ID: ${event.target_id.substring(0,6)}`;
            standardCounts[name] = (standardCounts[name] || 0) + 1;
        }
    }
    const consultationsByStandard = Object.entries(standardCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10); // Top 10

    // Process consultations by form
    const formNameMap = new Map(allForms.data?.map(f => [f.id, f.name]));
    const formCounts: Record<string, number> = {};
    if (formEvents.data) {
        for (const event of formEvents.data) {
            const name = formNameMap.get(event.target_id) || `ID: ${event.target_id.substring(0,6)}`;
            formCounts[name] = (formCounts[name] || 0) + 1;
        }
    }
    const consultationsByForm = Object.entries(formCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10); // Top 10

    return {
        scansLastPeriod: scans.count || 0,
        standardsConsultationsLastPeriod: standardsConsultations.count || 0,
        formsConsultationsLastPeriod: formsConsultations.count || 0,
        formsFilledLastPeriod: formsFilled.count || 0,
        consultationsByEngine,
        consultationsByStandard,
        consultationsByForm,
        consultationsByDayWorkstations: summarizeDailyEvents(workstationEvents.data || [], days),
        consultationsByDayStandards: summarizeDailyEvents(standardEvents.data || [], days),
        consultationsByDayForms: summarizeDailyEvents(formEvents.data || [], days),
    };
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
