
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at?: string;
}

export const createProfile = async (profile: Omit<Profile, 'id' | 'created_at'>): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: uuidv4(),
      full_name: profile.full_name,
      email: profile.email
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }
  
  return data as Profile;
};

export const getProfileById = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data as Profile | null;
};

export const getProfileByEmail = async (email: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile by email:', error);
    return null;
  }
  
  return data as Profile | null;
};

export const getAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  
  return data as Profile[];
};

export const updateProfile = async (id: string, updates: Partial<Omit<Profile, 'id' | 'created_at'>>): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  
  return data as Profile | null;
};

export const deleteProfile = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting profile:', error);
    return false;
  }
  
  return true;
};
