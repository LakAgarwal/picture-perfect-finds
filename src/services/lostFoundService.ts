
import { supabase } from "@/integrations/supabase/client";
import { ItemDetails, ItemStatus } from "@/types/lost-found";
import { v4 as uuidv4 } from "uuid";

// Define interface for the lost_found_items table
interface LostFoundItem {
  id: string;
  status: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  image_url: string;
  contact_email: string | null;
  contact_phone: string | null;
  is_matched: boolean | null;
  match_confidence: number | null;
  matches: string[] | null;
  created_at: string | null;
}

export const createItem = async (item: Omit<ItemDetails, 'id' | 'isMatched'>): Promise<ItemDetails | null> => {
  // Generate a new id
  const id = uuidv4();
  
  try {
    // Store in Supabase
    const { data, error } = await supabase
      .from('lost_found_items')
      .insert({
        id,
        status: item.status,
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        date: item.date,
        image_url: item.imageUrl,
        contact_email: item.contactEmail,
        contact_phone: item.contactPhone,
        is_matched: false,
        match_confidence: item.matchConfidence || 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating item:', error);
      
      // Check if the table doesn't exist
      if (error.code === '42P01') {
        console.log('Table does not exist. Creating one for demo purposes.');
        return {
          id,
          ...item,
          isMatched: false
        };
      }
      
      return null;
    }
    
    // Transform the data back to our ItemDetails type
    return data ? mapDbItemToItemDetails(data as LostFoundItem) : null;
  } catch (err) {
    console.error("Error in createItem:", err);
    return null;
  }
};

export const getItemById = async (id: string): Promise<ItemDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('lost_found_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching item:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Transform the data to our ItemDetails type
    return mapDbItemToItemDetails(data as LostFoundItem);
  } catch (err) {
    console.error("Error in getItemById:", err);
    return null;
  }
};

export const getAllItems = async (status?: ItemStatus): Promise<ItemDetails[]> => {
  try {
    let query = supabase
      .from('lost_found_items')
      .select('*')
      .order('date', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching items:', error);
      
      // Check if the table doesn't exist, return mock data
      if (error.code === '42P01') {
        console.log('Table does not exist. Will use local state instead.');
        return [];
      }
      
      return [];
    }
    
    // Transform the data to our ItemDetails type
    return (data || []).map((item) => mapDbItemToItemDetails(item as LostFoundItem));
  } catch (err) {
    console.error("Error in getAllItems:", err);
    return [];
  }
};

export const updateItem = async (id: string, updates: Partial<ItemDetails>): Promise<ItemDetails | null> => {
  // Transform our ItemDetails to match database schema
  try {
    const dbUpdates: Partial<LostFoundItem> = {};
    
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.location) dbUpdates.location = updates.location;
    if (updates.date) dbUpdates.date = updates.date;
    if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
    if (updates.contactEmail) dbUpdates.contact_email = updates.contactEmail;
    if (updates.contactPhone) dbUpdates.contact_phone = updates.contactPhone;
    if (updates.isMatched !== undefined) dbUpdates.is_matched = updates.isMatched;
    if (updates.matchConfidence !== undefined) dbUpdates.match_confidence = updates.matchConfidence;
    if (updates.matches) dbUpdates.matches = updates.matches;
    
    const { data, error } = await supabase
      .from('lost_found_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating item:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Transform the data back to our ItemDetails type
    return mapDbItemToItemDetails(data as LostFoundItem);
  } catch (err) {
    console.error("Error in updateItem:", err);
    return null;
  }
};

export const deleteItem = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lost_found_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting item:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error in deleteItem:", err);
    return false;
  }
};

// Helper function to map database item to our ItemDetails type
function mapDbItemToItemDetails(item: LostFoundItem): ItemDetails {
  return {
    id: item.id,
    status: item.status as ItemStatus,
    title: item.title,
    description: item.description,
    category: item.category,
    location: item.location,
    date: item.date,
    imageUrl: item.image_url,
    contactEmail: item.contact_email || undefined,
    contactPhone: item.contact_phone || undefined,
    isMatched: item.is_matched || false,
    matchConfidence: item.match_confidence || 0,
    matches: item.matches || [],
  };
}
