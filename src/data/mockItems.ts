
import { ItemDetails } from "@/types/lost-found";

export const mockItems: ItemDetails[] = [
  {
    id: "1",
    status: "lost",
    title: "Lost Orange Tabby Cat",
    description: "My orange tabby cat went missing from the downtown area. She has a white collar with a bell.",
    category: "Pet",
    location: "Downtown Central Park",
    date: "2023-07-15",
    imageUrl: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    contactEmail: "cat.owner@example.com",
    contactPhone: "555-123-4567",
    isMatched: false
  },
  {
    id: "2",
    status: "found",
    title: "Found Orange Cat",
    description: "Found a friendly orange tabby cat wandering near the park. Has a white collar with bell.",
    category: "Pet",
    location: "Central Park East Entrance",
    date: "2023-07-16",
    imageUrl: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    contactEmail: "finder@example.com",
    isMatched: false,
    matches: ["1"]
  },
  {
    id: "3",
    status: "lost",
    title: "Lost Blue Backpack",
    description: "Left my blue Northface backpack on the bench. Contains laptop and textbooks.",
    category: "Bag",
    location: "University Library",
    date: "2023-07-20",
    imageUrl: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    contactEmail: "student@example.com",
    contactPhone: "555-987-6543",
    isMatched: false
  },
  {
    id: "4",
    status: "found",
    title: "Found Grey Kitten",
    description: "Found a small grey kitten near the university campus. Very friendly and seems to be looking for its owner.",
    category: "Pet",
    location: "University Campus",
    date: "2023-07-22",
    imageUrl: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1",
    contactEmail: "campus.security@example.com",
    contactPhone: "555-111-2222",
    isMatched: false
  },
  {
    id: "5",
    status: "lost",
    title: "Lost Wallet",
    description: "Lost my brown leather wallet near the shopping center. Contains ID and credit cards.",
    category: "Personal Item",
    location: "Central Shopping Mall",
    date: "2023-07-25",
    imageUrl: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    contactEmail: "wallet.owner@example.com",
    contactPhone: "555-444-5555",
    isMatched: false
  }
];
