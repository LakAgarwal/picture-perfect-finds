
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface ImageData {
  id: string;
  profile_id: string;
  base64_data: string;
  created_at?: string;
}

// Helper function to convert a File to base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const uploadImage = async (file: File, profileId: string): Promise<string | null> => {
  try {
    // Convert the file to base64
    const base64Data = await fileToBase64(file);
    
    // Save the image reference in the database
    const { data, error: dbError } = await supabase
      .from('images')
      .insert({
        profile_id: profileId,
        base64_data: base64Data
      })
      .select();

    if (dbError) {
      console.error('Error saving image to database:', dbError);
      return null;
    }

    // Return the base64 data directly
    return base64Data;
  } catch (error) {
    console.error('Error in image upload process:', error);
    return null;
  }
};

export const getImagesByProfileId = async (profileId: string): Promise<ImageData[]> => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching images:', error);
    return [];
  }
  
  return data as ImageData[];
};

export const getAllImages = async (): Promise<ImageData[]> => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching all images:', error);
    return [];
  }
  
  return data as ImageData[];
};

export const deleteImage = async (id: string): Promise<boolean> => {
  // Delete from database
  const { error: dbError } = await supabase
    .from('images')
    .delete()
    .eq('id', id);
  
  if (dbError) {
    console.error('Error deleting image from database:', dbError);
    return false;
  }
  
  return true;
};
