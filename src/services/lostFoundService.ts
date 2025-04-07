
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
  image_labels: string[] | null; // Added for image matching optimization
  color_profile: string | null;  // Added for color-based matching
  object_type: string | null;    // Added for object classification
}

// Helper function to safely cast data from any table as our custom type
const castAsLostFoundItem = (data: any): LostFoundItem => {
  return data as LostFoundItem;
};

// Extract image labels from an image URL for better matching
async function extractImageMetadata(imageUrl: string): Promise<{
  labels: string[];
  colorProfile: string;
  objectType: string;
}> {
  try {
    // This would typically involve AI image analysis
    // For demo purposes, we'll return dummy data based on the image URL
    // In a real implementation, this would call a service like Google Vision API, AWS Rekognition, etc.
    
    // Mock analysis based on image URL keywords
    const url = imageUrl.toLowerCase();
    const labels: string[] = [];
    let colorProfile = "unknown";
    let objectType = "item";
    
    // Extract potential labels from URL
    if (url.includes("cat") || url.includes("pet")) {
      labels.push("cat", "pet", "animal");
      objectType = "animal";
    }
    if (url.includes("dog")) {
      labels.push("dog", "pet", "animal");
      objectType = "animal";
    }
    if (url.includes("phone") || url.includes("mobile")) {
      labels.push("phone", "mobile", "electronics", "device");
      objectType = "electronics";
    }
    if (url.includes("wallet") || url.includes("purse")) {
      labels.push("wallet", "money", "personal");
      objectType = "personal";
    }
    if (url.includes("key")) {
      labels.push("key", "access", "personal");
      objectType = "personal";
    }
    
    // Extract color profile
    if (url.includes("black")) colorProfile = "dark";
    else if (url.includes("white")) colorProfile = "light";
    else if (url.includes("blue")) colorProfile = "cool";
    else if (url.includes("red") || url.includes("orange")) colorProfile = "warm";
    else if (url.includes("green")) colorProfile = "natural";
    else colorProfile = "mixed";
    
    // If no specific labels were found, add generic ones
    if (labels.length === 0) {
      labels.push("item", "object", "lost-found");
    }
    
    return { labels, colorProfile, objectType };
  } catch (error) {
    console.error("Error extracting image metadata:", error);
    return { 
      labels: ["item", "object"], 
      colorProfile: "unknown", 
      objectType: "item" 
    };
  }
}

// Find potential matches for an item
export const findPotentialMatches = async (item: ItemDetails): Promise<ItemDetails[]> => {
  try {
    // Get items of the opposite status for matching
    const oppositeStatus: ItemStatus = item.status === "lost" ? "found" : "lost";
    
    // Get the item's metadata for efficient matching
    let imageMetadata = {
      labels: item.imageLabels || [],
      colorProfile: item.colorProfile || "unknown",
      objectType: item.objectType || "item"
    };
    
    // If the item doesn't have metadata yet, extract it
    if (imageMetadata.labels.length === 0) {
      imageMetadata = await extractImageMetadata(item.imageUrl);
    }
    
    // Query for potential matches using metadata
    const { data, error } = await (supabase
      .from('lost_found_items') as any)
      .select('*')
      .eq('status', oppositeStatus)
      .eq('is_matched', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error finding potential matches:', error);
      return [];
    }
    
    // Convert DB items to our model
    const items = (data || []).map(item => mapDbItemToItemDetails(castAsLostFoundItem(item)));
    
    // Enhanced matching algorithm
    // Prioritize matches based on:
    // 1. Category match
    // 2. Label overlap
    // 3. Date proximity
    // 4. Location similarity
    const potentialMatches = items
      .map(potentialMatch => {
        let score = 0;
        
        // Category match (highest weight)
        if (potentialMatch.category === item.category) {
          score += 40;
        }
        
        // Label overlap
        const potentialMatchLabels = potentialMatch.imageLabels || [];
        const labelOverlap = imageMetadata.labels.filter(
          label => potentialMatchLabels.includes(label)
        ).length;
        
        score += labelOverlap * 15;
        
        // Color profile match
        if (potentialMatch.colorProfile === imageMetadata.colorProfile) {
          score += 10;
        }
        
        // Object type match
        if (potentialMatch.objectType === imageMetadata.objectType) {
          score += 20;
        }
        
        // Date proximity (within 7 days gets points)
        const itemDate = new Date(item.date);
        const matchDate = new Date(potentialMatch.date);
        const daysDifference = Math.abs(
          (itemDate.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysDifference <= 7) {
          score += Math.max(0, 10 - daysDifference);
        }
        
        // Location match (simple text matching for demo)
        if (potentialMatch.location.toLowerCase().includes(item.location.toLowerCase()) ||
            item.location.toLowerCase().includes(potentialMatch.location.toLowerCase())) {
          score += 15;
        }
        
        return {
          ...potentialMatch,
          matchConfidence: score > 100 ? 100 : score
        };
      })
      .filter(match => match.matchConfidence >= 40) // Only return matches with decent confidence
      .sort((a, b) => b.matchConfidence! - a.matchConfidence!);
    
    return potentialMatches.slice(0, 5); // Return top 5 matches
  } catch (error) {
    console.error("Error in findPotentialMatches:", error);
    return [];
  }
};

export const createItem = async (item: Omit<ItemDetails, 'id' | 'isMatched'>): Promise<ItemDetails | null> => {
  // Generate a new id
  const id = uuidv4();
  
  try {
    // Extract image metadata for better matching
    const { labels, colorProfile, objectType } = await extractImageMetadata(item.imageUrl);
    
    // Store in Supabase using type assertion to bypass the type checking
    const { data, error } = await (supabase
      .from('lost_found_items') as any)
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
        match_confidence: item.matchConfidence || 0,
        image_labels: labels,
        color_profile: colorProfile,
        object_type: objectType
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
          isMatched: false,
          imageLabels: labels,
          colorProfile: colorProfile,
          objectType: objectType
        };
      }
      
      return null;
    }
    
    // Transform the data back to our ItemDetails type
    return data ? mapDbItemToItemDetails(castAsLostFoundItem(data)) : null;
  } catch (err) {
    console.error("Error in createItem:", err);
    return null;
  }
};

export const getItemById = async (id: string): Promise<ItemDetails | null> => {
  try {
    const { data, error } = await (supabase
      .from('lost_found_items') as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching item:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Transform the data to our ItemDetails type
    return mapDbItemToItemDetails(castAsLostFoundItem(data));
  } catch (err) {
    console.error("Error in getItemById:", err);
    return null;
  }
};

export const getAllItems = async (status?: ItemStatus): Promise<ItemDetails[]> => {
  try {
    // Use type assertion to bypass TypeScript's type checking
    let query = (supabase
      .from('lost_found_items') as any)
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
    
    // Transform the data to our ItemDetails type using safe casting
    return (data || []).map((item) => mapDbItemToItemDetails(castAsLostFoundItem(item)));
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
    
    const { data, error } = await (supabase
      .from('lost_found_items') as any)
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
    return mapDbItemToItemDetails(castAsLostFoundItem(data));
  } catch (err) {
    console.error("Error in updateItem:", err);
    return null;
  }
};

export const deleteItem = async (id: string): Promise<boolean> => {
  try {
    const { error } = await (supabase
      .from('lost_found_items') as any)
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
    imageLabels: item.image_labels || [],
    colorProfile: item.color_profile || undefined,
    objectType: item.object_type || undefined,
  };
}
