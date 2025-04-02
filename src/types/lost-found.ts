
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
}
