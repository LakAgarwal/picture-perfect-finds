
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface ImageData {
  id: string;
  profile_id: string;
  url: string;
  created_at?: string;
}

export const uploadImage = async (file: File, profileId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    // Check if bucket exists
    const { data: bucketList } = await supabase.storage.listBuckets();
    const imagesBucketExists = bucketList?.some(bucket => bucket.name === 'images');
    
    // Only try to create bucket if it doesn't exist
    if (!imagesBucketExists) {
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return null;
      }
    }

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;
    
    // Save the image reference in the database
    const { error: dbError } = await supabase
      .from('images')
      .insert({
        profile_id: profileId,
        url: publicUrl
      });

    if (dbError) {
      console.error('Error saving image to database:', dbError);
      return null;
    }

    return publicUrl;
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
  // First get the image URL to delete from storage
  const { data: imageData, error: fetchError } = await supabase
    .from('images')
    .select('url')
    .eq('id', id)
    .maybeSingle();
  
  if (fetchError || !imageData) {
    console.error('Error fetching image before deletion:', fetchError);
    return false;
  }
  
  // Extract filename from URL
  const url = imageData.url;
  const filename = url.substring(url.lastIndexOf('/') + 1);
  
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('images')
    .remove([filename]);
  
  if (storageError) {
    console.error('Error deleting image from storage:', storageError);
    // Continue to delete database entry even if storage deletion fails
  }
  
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
