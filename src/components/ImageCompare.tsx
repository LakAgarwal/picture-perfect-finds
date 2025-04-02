
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ItemDetails } from "@/types/lost-found";
import { useToast } from "@/components/ui/use-toast";

interface ImageCompareProps {
  isOpen: boolean;
  onClose: () => void;
  lostItem: ItemDetails | null;
  foundItem: ItemDetails | null;
}

const ImageCompare: React.FC<ImageCompareProps> = ({
  isOpen,
  onClose,
  lostItem,
  foundItem,
}) => {
  const { toast } = useToast();

  if (!lostItem || !foundItem) return null;

  const handleConfirmMatch = () => {
    // In a real app, you would make an API call to confirm the match
    toast({
      title: "Match Confirmed",
      description: "The owner has been notified of the potential match.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Compare Items</DialogTitle>
          <DialogDescription>
            Compare the lost and found items to determine if they match.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded mr-2">
                LOST
              </span>
              {lostItem.title}
            </h3>
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <img
                src={lostItem.imageUrl}
                alt={lostItem.title}
                className="w-full h-64 object-cover"
              />
            </div>
            <p className="text-sm">{lostItem.description}</p>
            <div className="text-xs text-gray-500">
              <p>Lost at: {lostItem.location}</p>
              <p>Lost on: {lostItem.date}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded mr-2">
                FOUND
              </span>
              {foundItem.title}
            </h3>
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <img
                src={foundItem.imageUrl}
                alt={foundItem.title}
                className="w-full h-64 object-cover"
              />
            </div>
            <p className="text-sm">{foundItem.description}</p>
            <div className="text-xs text-gray-500">
              <p>Found at: {foundItem.location}</p>
              <p>Found on: {foundItem.date}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800">Match Analysis</h4>
          <p className="text-xs text-yellow-700 mt-1">
            Our image comparison algorithm suggests these items might match. 
            Review the details carefully and confirm if you believe they are the same item.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-4">
          <Button variant="outline" onClick={onClose}>
            Not a Match
          </Button>
          <Button 
            className="bg-lostfound-primary hover:bg-lostfound-secondary"
            onClick={handleConfirmMatch}
          >
            Confirm Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCompare;
