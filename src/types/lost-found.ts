
export type ItemStatus = 'lost' | 'found';

export interface ItemDetails {
  id: string;
  status: ItemStatus;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  imageUrl: string;
  contactEmail?: string;
  contactPhone?: string;
  matches?: string[];
  isMatched?: boolean;
  matchConfidence?: number;
  imageLabels?: string[]; // Added for image matching optimization
  colorProfile?: string;  // Added for color-based matching
  objectType?: string;    // Added for object classification
}
