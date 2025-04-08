
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
  // Additional properties used in the service layer
  created_at?: string;
  is_matched?: boolean;
  match_confidence?: number;
  color_profile?: string;
  object_type?: string;
  image_labels?: string[];
}

// Export LostFoundItem as an alias for ItemDetails to maintain compatibility
export type LostFoundItem = ItemDetails;
