
import React, { useState } from "react";
import FoundItemForm from "./FoundItemForm";
import { createProfile, getProfileByEmail } from "@/services/profileService";
import { uploadImage } from "@/services/imageService";
import { toast } from "@/components/ui/use-toast";
import { ItemDetails, ItemStatus } from "@/types/lost-found";
import { v4 as uuidv4 } from "uuid";
import { createItem } from "@/services/lostFoundService";

interface EnhancedFoundItemFormProps {
  onSubmitComplete: (item: ItemDetails) => void;
}

const EnhancedFoundItemForm: React.FC<EnhancedFoundItemFormProps> = ({ onSubmitComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      // Extract form data
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const category = formData.get("category") as string;
      const location = formData.get("location") as string;
      const date = formData.get("date") as string;
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const phone = formData.get("phone") as string || undefined;
      const imageBase64 = formData.get("imageBase64") as string;
      
      // Create or get profile
      let profile = await getProfileByEmail(email);
      
      if (!profile) {
        profile = await createProfile({
          full_name: name,
          email: email
        });
        
        if (!profile) {
          throw new Error("Failed to create profile");
        }
      }
      
      // Use the base64 image data directly
      let imageUrl = "";
      if (imageBase64) {
        // Store the base64 image in the database
        const uploadedUrl = await uploadImage(
          // Create a dummy file object to pass to uploadImage
          new File([new Blob([imageBase64])], "image.jpg", { type: "image/jpeg" }),
          profile.id
        );
        
        if (!uploadedUrl) {
          throw new Error("Failed to upload image");
        }
        imageUrl = imageBase64; // Use the base64 data as the URL
      } else {
        // Use placeholder image if no image was uploaded
        imageUrl = "/placeholder.svg";
      }
      
      // Create found item object
      const newItem: ItemDetails = {
        id: uuidv4(),
        status: "found" as ItemStatus,
        title,
        description,
        category,
        location,
        date,
        imageUrl,
        contactEmail: email,
        contactPhone: phone,
        isMatched: false,
      };
      
      // Save the item to the database
      await createItem({
        title: newItem.title,
        description: newItem.description,
        category: newItem.category,
        location: newItem.location,
        date: newItem.date,
        status: newItem.status,
        imageUrl: newItem.imageUrl,
        contactEmail: newItem.contactEmail,
        contactPhone: newItem.contactPhone,
        isMatched: newItem.isMatched,
      });
      
      // Call the provided callback with the new item
      onSubmitComplete(newItem);
      
      toast({
        title: "Item Reported",
        description: "Your found item has been successfully reported",
        variant: "default",
      });
    } catch (error) {
      console.error("Error submitting found item:", error);
      toast({
        title: "Submission Failed",
        description: "There was a problem reporting your found item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <FoundItemForm onSubmitComplete={handleFormSubmit} />;
};

export default EnhancedFoundItemForm;
