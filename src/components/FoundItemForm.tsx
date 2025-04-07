
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form,
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Image, Upload } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Please provide a detailed description" }),
  category: z.string().min(1, { message: "Category is required" }),
  location: z.string().min(3, { message: "Location is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FoundItemFormProps {
  onSubmitComplete: (formData: FormData) => void;
}

const FoundItemForm: React.FC<FoundItemFormProps> = ({ onSubmitComplete }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      location: "",
      date: new Date().toISOString().split('T')[0],
      name: "",
      email: "",
      phone: "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!imagePreview) {
      toast({
        title: "Image Required",
        description: "Please upload an image of the found item",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData to send
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("location", data.location);
      formData.append("date", data.date);
      formData.append("name", data.name);
      formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);
      
      // Add image file
      const imageFile = await fetch(imagePreview)
        .then(res => res.blob())
        .then(blob => new File([blob], "image.jpg", { type: "image/jpeg" }));
      
      formData.append("image", imageFile);
      
      // Submit the form data
      onSubmitComplete(formData);
      
      // Reset the form
      form.reset();
      setImagePreview(null);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Item Image</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload a clear image of the item you found to help others identify it
              </p>
              
              {imagePreview ? (
                <div className="relative mt-2 rounded-lg overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-64 object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2 bg-white hover:bg-gray-100"
                    onClick={() => setImagePreview(null)}
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <div className="upload-zone">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-lostfound-light text-lostfound-primary">
                      <Camera className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="font-medium">Click to upload an image</p>
                      <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (max. 5MB)</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => document.getElementById('imageUpload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Found Black Wallet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a detailed description of the item..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Electronics, Wallet, Keys" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Found At Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Central Park, Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Found</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 555-123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-green-500 hover:bg-green-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Found Item Report"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default FoundItemForm;
