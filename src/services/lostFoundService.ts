
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { ItemStatus, ItemDetails, LostFoundItem } from '@/types/lost-found';

// Helper function to safely cast database response to LostFoundItem type
const castAsLostFoundItem = (item: any): LostFoundItem => {
  return item as LostFoundItem;
};

/**
 * Get all items from the database
 */
export const getAllItems = async (): Promise<LostFoundItem[]> => {
  try {
    const { data, error } = await supabase
      .from('lost_found_items' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
      throw new Error(`Error fetching items: ${error.message}`);
    }

    return data ? data.map(castAsLostFoundItem) : [];
  } catch (error) {
    console.error('Unexpected error fetching items:', error);
    throw error;
  }
};

/**
 * Get a specific item by its ID
 */
export const getItemById = async (id: string): Promise<LostFoundItem> => {
  try {
    const { data, error } = await supabase
      .from('lost_found_items' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching item with ID ${id}:`, error);
      throw new Error(`Error fetching item: ${error.message}`);
    }

    return castAsLostFoundItem(data);
  } catch (error) {
    console.error('Unexpected error fetching item:', error);
    throw error;
  }
};

/**
 * Create a new item
 */
export const createItem = async (item: Omit<LostFoundItem, 'id' | 'created_at'>): Promise<LostFoundItem> => {
  try {
    const newItem = {
      ...item,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      is_matched: false,
      matches: [],
      match_confidence: 0,
    };

    const { data, error } = await supabase
      .from('lost_found_items' as any)
      .insert(newItem)
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
      throw new Error(`Error creating item: ${error.message}`);
    }

    return castAsLostFoundItem(data);
  } catch (error) {
    console.error('Unexpected error creating item:', error);
    throw error;
  }
};

/**
 * Update an existing item
 */
export const updateItem = async (id: string, updates: Partial<LostFoundItem>): Promise<LostFoundItem> => {
  try {
    const { data, error } = await supabase
      .from('lost_found_items' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating item with ID ${id}:`, error);
      throw new Error(`Error updating item: ${error.message}`);
    }

    return castAsLostFoundItem(data);
  } catch (error) {
    console.error('Unexpected error updating item:', error);
    throw error;
  }
};

/**
 * Delete an item
 */
export const deleteItem = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lost_found_items' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting item with ID ${id}:`, error);
      throw new Error(`Error deleting item: ${error.message}`);
    }
  } catch (error) {
    console.error('Unexpected error deleting item:', error);
    throw error;
  }
};

/**
 * Find potential matches for an item based on various criteria
 * This is an enhanced version that uses metadata fields for better matching
 */
export const findPotentialMatches = async (item: LostFoundItem): Promise<LostFoundItem[]> => {
  try {
    // Determine which status to search for (opposite of current item)
    const searchStatus = item.status === 'lost' ? 'found' : 'lost';

    // Query for potential matches using multiple criteria
    const { data, error } = await supabase
      .from('lost_found_items' as any)
      .select('*')
      .eq('status', searchStatus)
      .eq('is_matched', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding potential matches:', error);
      throw new Error(`Error finding potential matches: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Calculate match scores for each potential match
    const potentialMatches = data.map(candidateItem => {
      const castedItem = castAsLostFoundItem(candidateItem);
      const matchScore = calculateMatchScore(item, castedItem);
      return {
        ...castedItem,
        match_confidence: matchScore
      };
    });

    // Filter matches with a significant confidence level and sort by score
    const significantMatches = potentialMatches
      .filter(match => match.match_confidence >= 50)
      .sort((a, b) => b.match_confidence - a.match_confidence);

    return significantMatches;
  } catch (error) {
    console.error('Unexpected error finding potential matches:', error);
    throw error;
  }
};

/**
 * Calculate a match score between two items based on various attributes
 */
const calculateMatchScore = (item1: LostFoundItem, item2: LostFoundItem): number => {
  // Base score starts at 0
  let score = 0;
  
  // Category match gives a significant boost
  if (item1.category.toLowerCase() === item2.category.toLowerCase()) {
    score += 30;
  }
  
  // Check for word matches in titles
  const title1Words = item1.title.toLowerCase().split(/\s+/);
  const title2Words = item2.title.toLowerCase().split(/\s+/);
  
  const commonTitleWords = title1Words.filter(word => 
    word.length > 3 && title2Words.includes(word)
  );
  
  score += commonTitleWords.length * 10;
  
  // Check for keyword matches in description
  const desc1Words = item1.description.toLowerCase().split(/\s+/);
  const desc2Words = item2.description.toLowerCase().split(/\s+/);
  
  const commonDescWords = desc1Words.filter(word => 
    word.length > 3 && desc2Words.includes(word)
  );
  
  score += Math.min(commonDescWords.length * 5, 20); // Cap at 20 points
  
  // Location proximity bonus
  if (item1.location.toLowerCase() === item2.location.toLowerCase()) {
    score += 15;
  }
  
  // Date proximity bonus (if dates are close)
  try {
    const date1 = new Date(item1.date);
    const date2 = new Date(item2.date);
    const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff <= 3) {
      score += 10;
    } else if (daysDiff <= 7) {
      score += 5;
    }
  } catch (e) {
    // Skip date comparison if dates can't be parsed
  }
  
  // Check metadata if available
  if (item1.color_profile && item2.color_profile && 
      item1.color_profile === item2.color_profile) {
    score += 10;
  }
  
  if (item1.object_type && item2.object_type && 
      item1.object_type === item2.object_type) {
    score += 15;
  }
  
  if (item1.image_labels && item2.image_labels) {
    const commonLabels = item1.image_labels.filter(label => 
      item2.image_labels?.includes(label)
    );
    
    score += Math.min(commonLabels.length * 5, 20); // Cap at 20 points
  }
  
  // Cap the maximum score at 100
  return Math.min(Math.round(score), 100);
};

// Sample data for categories
const sampleCategories = [
  'Electronics', 'Wallets', 'Keys', 'Bags', 'Jewelry', 'Clothing',
  'Books', 'Documents', 'Smartphones', 'Laptops', 'Headphones',
  'Glasses', 'Watches', 'Toys', 'Musical Instruments', 'Sports Equipment'
];

// Sample data for locations
const sampleLocations = [
  'Central Park', 'Main Street', 'University Campus', 'Shopping Mall',
  'City Library', 'Bus Station', 'Train Station', 'Downtown', 'South Beach',
  'Conference Center', 'Sports Stadium', 'Community Center', 'Museum',
  'Public Pool', 'Metro Station', 'Airport'
];

// Sample data for object types
const sampleObjectTypes = [
  'phone', 'wallet', 'keys', 'bag', 'jewelry', 'clothing',
  'book', 'document', 'electronic', 'accessory', 'pet',
  'toy', 'instrument', 'equipment'
];

// Sample image URLs (these should be valid URLs to images)
const sampleImageUrls = [
  'https://images.unsplash.com/photo-1494022299300-899b96e49893', // Wallet
  'https://images.unsplash.com/photo-1533873984035-25970ab07461', // Keys
  'https://images.unsplash.com/photo-1546938576-6e6a64f317cc', // Bag
  'https://images.unsplash.com/photo-1586941962765-d3896cc85ac8', // Smartphone
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d', // Headphones
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f', // Glasses
  'https://images.unsplash.com/photo-1523170335258-f5ed11844a49', // Watch
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f', // Book
  'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83', // Jewelry
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff', // Sports
  'https://images.unsplash.com/photo-1503602642458-232111445657', // Random item
  'https://images.unsplash.com/photo-1560343090-f0409e92791a', // Laptop
];

// Generate mock items
export const generateMockItems = async (count: number = 20): Promise<void> => {
  try {
    const mockItems = [];
    
    // Generate random items
    for (let i = 0; i < count; i++) {
      const status: ItemStatus = Math.random() > 0.5 ? 'lost' : 'found';
      const category = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];
      const objectType = sampleObjectTypes[Math.floor(Math.random() * sampleObjectTypes.length)];
      
      // Create date within the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const imageUrl = sampleImageUrls[Math.floor(Math.random() * sampleImageUrls.length)];
      
      // Generate random image labels based on category and objectType
      const baseLabels = [category.toLowerCase(), objectType];
      const extraLabels = ['item', 'object', 'personal'];
      const randomLabels = [...baseLabels];
      
      // Add 2-4 random extra labels
      for (let j = 0; j < 2 + Math.floor(Math.random() * 3); j++) {
        const label = extraLabels[Math.floor(Math.random() * extraLabels.length)];
        if (!randomLabels.includes(label)) {
          randomLabels.push(label);
        }
      }
      
      // Create random color profile (hex color)
      const colorProfile = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
      
      const mockItem = {
        id: uuidv4(),
        status,
        title: `${status === 'lost' ? 'Lost' : 'Found'} ${category} - ${objectType}`,
        description: `${status === 'lost' ? 'I lost my' : 'I found a'} ${category.toLowerCase()} ${
          Math.random() > 0.5 ? 'yesterday' : 'a few days ago'
        }. ${
          Math.random() > 0.5 ? 'It has a distinctive mark or feature.' : 'Please contact me if this belongs to you.'
        }`,
        category,
        location: sampleLocations[Math.floor(Math.random() * sampleLocations.length)],
        date: date.toISOString().split('T')[0],
        imageUrl: `${imageUrl}?random=${i}`,
        is_matched: false,
        matches: [],
        match_confidence: 0,
        created_at: new Date().toISOString(),
        contactEmail: `user${Math.floor(Math.random() * 1000)}@example.com`,
        contactPhone: Math.random() > 0.5 ? `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : null,
        image_labels: randomLabels,
        color_profile: colorProfile,
        object_type: objectType
      };
      
      mockItems.push(mockItem);
    }
    
    // Create matching pairs for 30% of the items
    const pairCount = Math.floor(count * 0.3) / 2;
    for (let i = 0; i < pairCount; i++) {
      // Find a lost item
      const lostIndex = mockItems.findIndex(item => item.status === 'lost' && !item.matches.length);
      if (lostIndex >= 0) {
        // Create a matching found item with similar properties
        const lostItem = mockItems[lostIndex];
        const foundItem = {
          ...lostItem,
          id: uuidv4(),
          status: 'found',
          title: `Found ${lostItem.category} - ${lostItem.object_type}`,
          description: `I found this ${lostItem.category.toLowerCase()} near ${lostItem.location}. Contact me to claim it.`,
          // Slightly modify date (1-3 days difference)
          date: new Date(new Date(lostItem.date).getTime() + (1 + Math.floor(Math.random() * 3)) * 86400000).toISOString().split('T')[0],
          contactEmail: `finder${Math.floor(Math.random() * 1000)}@example.com`,
          contactPhone: Math.random() > 0.5 ? `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : null,
        };
        
        // Add to mock items
        mockItems.push(foundItem);
        
        // Update matches
        mockItems[lostIndex].matches = [foundItem.id];
        mockItems[lostIndex].match_confidence = 75 + Math.floor(Math.random() * 25); // 75-99%
      }
    }
    
    // Insert all mock items in batches
    const batchSize = 10;
    for (let i = 0; i < mockItems.length; i += batchSize) {
      const batch = mockItems.slice(i, i + batchSize);
      const { error } = await supabase.from('lost_found_items' as any).insert(batch);
      if (error) {
        console.error('Error inserting mock items:', error);
        throw new Error(`Error inserting mock items: ${error.message}`);
      }
    }
    
    console.log(`Successfully generated ${mockItems.length} mock items`);
  } catch (error) {
    console.error('Error generating mock items:', error);
    throw error;
  }
};
