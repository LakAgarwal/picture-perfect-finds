
import React, { useEffect, useState, useRef } from "react";
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
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to use browser cache
env.allowLocalModels = false;
env.useBrowserCache = true;

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
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<any>(null);

  // Load the model when the component mounts
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Load the image-embedding model only once and store in ref
        if (!modelRef.current) {
          console.log("Loading image embedding model...");
          modelRef.current = await pipeline(
            'feature-extraction',
            'Xenova/clip-vit-base-patch16',
            { device: 'webgpu' } // Will fallback to CPU if WebGPU not available
          );
          console.log("Model loaded successfully");
        }
      } catch (err) {
        console.error("Error loading model:", err);
        setError("Failed to load image comparison model. Please try again later.");
      }
    };

    loadModel();
  }, []);

  // Perform image comparison when the dialog opens
  useEffect(() => {
    if (isOpen && lostItem && foundItem && !analysisComplete && !isAnalyzing) {
      compareImages();
    }
  }, [isOpen, lostItem, foundItem, analysisComplete, isAnalyzing]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setAnalysisComplete(false);
      setError(null);
    }
  }, [isOpen]);

  // Compare the images using the CLIP model
  const compareImages = async () => {
    if (!lostItem || !foundItem || !modelRef.current) return;

    setIsAnalyzing(true);
    setConfidence(0);
    setError(null);

    try {
      // Simple progress simulation for UI feedback
      const progressInterval = setInterval(() => {
        setConfidence(prev => Math.min(prev + 5, 95));
      }, 200);

      // Get image URLs
      const lostImageUrl = lostItem.imageUrl;
      const foundImageUrl = foundItem.imageUrl;

      console.log("Comparing images:", lostImageUrl, foundImageUrl);

      // Get image embeddings
      const [lostEmbedding, foundEmbedding] = await Promise.all([
        modelRef.current(lostImageUrl),
        modelRef.current(foundImageUrl)
      ]);

      clearInterval(progressInterval);

      // Calculate cosine similarity between the embeddings
      const similarityScore = calculateCosineSimilarity(
        lostEmbedding.data, 
        foundEmbedding.data
      );

      // Convert similarity to percentage (0.7 → 70%)
      const confidencePercentage = Math.round(similarityScore * 100);
      
      console.log("Similarity score:", similarityScore, "Confidence:", confidencePercentage);
      
      // Update UI with final confidence score
      setConfidence(confidencePercentage);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    } catch (err) {
      console.error("Error comparing images:", err);
      setError("Error analyzing images. Please try again.");
      setIsAnalyzing(false);
      setConfidence(0);
    }
  };

  // Calculate cosine similarity between two vectors
  const calculateCosineSimilarity = (vecA: number[], vecB: number[]) => {
    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    // Avoid division by zero
    if (normA === 0 || normB === 0) return 0;
    
    // Cosine similarity formula: dot(A, B) / (||A|| * ||B||)
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

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
          
          {error ? (
            <div className="text-red-500 text-sm">
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={compareImages}
              >
                Try Again
              </Button>
            </div>
          ) : isAnalyzing ? (
            <div className="space-y-2">
              <p className="text-xs text-yellow-700">
                Analyzing image similarities using computer vision... This may take a moment.
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
                  ? "The images show strong visual similarities detected by computer vision. This is likely to be the same item." 
                  : confidence >= 40 
                    ? "The AI detects some visual similarities. Review carefully before confirming." 
                    : "The AI detects few visual similarities. These are likely different items."}
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
