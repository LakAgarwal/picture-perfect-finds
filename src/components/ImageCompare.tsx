
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  const [confidence, setConfidence] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);

  // Simulate image comparison analysis
  useEffect(() => {
    if (isOpen && lostItem && foundItem && !analysisComplete) {
      setIsAnalyzing(true);
      setConfidence(0);
      
      // Simulating progressive analysis
      const interval = setInterval(() => {
        setConfidence(prev => {
          // This is where a real image comparison algorithm would work
          // For demo, we're using a predetermined score for the cat images
          const targetConfidence = lostItem.id === "1" && foundItem.id === "2" ? 87 : 
                                  Math.floor(Math.random() * 60) + 20; // Random 20-80% for other items
          
          const step = Math.min(prev + 5, targetConfidence);
          if (step >= targetConfidence) {
            clearInterval(interval);
            setIsAnalyzing(false);
            setAnalysisComplete(true);
          }
          return step;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isOpen, lostItem, foundItem, analysisComplete]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setAnalysisComplete(false);
    }
  }, [isOpen]);

  if (!lostItem || !foundItem) return null;

  const handleConfirmMatch = () => {
    // In a real app, you would make an API call to confirm the match
    // and update both items with match information
    toast({
      title: "Match Confirmed",
      description: "The owner has been notified of the potential match.",
    });
    onClose();
  };

  const getConfidenceColor = () => {
    if (confidence < 40) return "text-red-500";
    if (confidence < 70) return "text-yellow-500";
    return "text-green-500";
  };

  const getConfidenceLabel = () => {
    if (confidence < 40) return "Low Match Probability";
    if (confidence < 70) return "Possible Match";
    return "High Match Probability";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Compare Items</DialogTitle>
          <DialogDescription>
            Our AI is analyzing visual similarities between the lost and found items.
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
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Image Analysis</h4>
          
          {isAnalyzing ? (
            <div className="space-y-2">
              <p className="text-xs text-yellow-700">
                Analyzing image similarities... This may take a moment.
              </p>
              <Progress value={confidence} className="h-2" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Match confidence:</p>
                <p className={`text-lg font-bold ${getConfidenceColor()}`}>{confidence}%</p>
              </div>
              <Progress value={confidence} className="h-2" />
              <p className={`text-sm font-medium mt-2 ${getConfidenceColor()}`}>
                {getConfidenceLabel()}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {confidence >= 70 
                  ? "The images show strong visual similarities. This is likely to be the same item." 
                  : confidence >= 40 
                    ? "The images show some similarities. Review carefully before confirming." 
                    : "The images show few similarities. These are likely different items."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-4">
          <Button variant="outline" onClick={onClose}>
            Not a Match
          </Button>
          <Button 
            className="bg-lostfound-primary hover:bg-lostfound-secondary"
            onClick={handleConfirmMatch}
            disabled={isAnalyzing || confidence < 40}
          >
            {isAnalyzing ? "Analyzing..." : "Confirm Match"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCompare;
