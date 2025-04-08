import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  AlertCircle, 
  Bell, 
  Filter, 
  CheckCircle, 
  CalendarDays,
  MapPin,
  Tag,
  Upload,
  Volume2,
  VolumeX
} from "lucide-react";
import ItemCard from "@/components/ItemCard";
import EnhancedLostItemForm from "@/components/EnhancedLostItemForm";
import EnhancedFoundItemForm from "@/components/EnhancedFoundItemForm";
import ItemDetails from "@/components/ItemDetails";
import ContactDialog from "@/components/ContactDialog";
import ImageCompare from "@/components/ImageCompare";
import { ItemDetails as ItemDetailsType, ItemStatus } from "@/types/lost-found";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllItems, 
  createItem, 
  updateItem, 
  findPotentialMatches
} from "@/services/lostFoundService";
import { SoundEffect, useSoundEffects } from "@/utils/soundEffects";

const LostAndFound: React.FC = () => {
  const [filteredItems, setFilteredItems] = useState<ItemDetailsType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"browse" | "lost" | "found">("browse");
  const [filterStatus, setFilterStatus] = useState<ItemStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  
  const [selectedItem, setSelectedItem] = useState<ItemDetailsType | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareItems, setCompareItems] = useState<{
    lost: ItemDetailsType | null;
    found: ItemDetailsType | null;
  }>({ lost: null, found: null });
  
  const [potentialMatches, setPotentialMatches] = useState<ItemDetailsType[]>([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { enabled: soundEnabled, toggleSoundEffects, play: playSound } = useSoundEffects();

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['lost-found-items'],
    queryFn: () => getAllItems(),
  });

  const createItemMutation = useMutation({
    mutationFn: createItem,
    onSuccess: async (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['lost-found-items'] });
      
      playSound(SoundEffect.REPORT_SUBMITTED);
      
      if (newItem) {
        setIsMatchesLoading(true);
        try {
          const matches = await findPotentialMatches(newItem);
          setPotentialMatches(matches);
          
          if (matches.length > 0) {
            playSound(SoundEffect.MATCH_FOUND);
            
            toast({
              title: "Potential matches found!",
              description: `We found ${matches.length} potential ${newItem.status === 'lost' ? 'found items' : 'lost items'} that might match yours.`,
            });
          }
        } catch (error) {
          console.error("Error finding matches:", error);
        } finally {
          setIsMatchesLoading(false);
        }
      }
    },
  });

  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    items.forEach(item => {
      if (item.category) {
        uniqueCategories.add(item.category);
      }
    });
    return Array.from(uniqueCategories);
  }, [items]);

  useEffect(() => {
    if (!items) return;
    
    const filtered = items.filter((item) => {
      const statusMatch = filterStatus === "all" || item.status === filterStatus;
      if (!statusMatch) return false;
      
      const categoryMatch = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase();
      if (!categoryMatch) return false;
      
      if (searchQuery.trim() === '') return true;
      
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
      );
    });
    
    setFilteredItems(filtered);
  }, [items, searchQuery, filterStatus, categoryFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: ItemStatus | "all") => {
    setFilterStatus(status);
  };

  const handleCategoryFilter = (category: string | "all") => {
    setCategoryFilter(category);
  };

  const handleItemClick = (item: ItemDetailsType) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleContactClick = (item: ItemDetailsType) => {
    setSelectedItem(item);
    setIsContactOpen(true);
  };

  const handleCompareClick = (lostItem: ItemDetailsType, foundItem: ItemDetailsType) => {
    setCompareItems({ lost: lostItem, found: foundItem });
    setIsCompareOpen(true);
  };

  const handleLostItemSubmit = async (item: ItemDetailsType) => {
    try {
      await createItemMutation.mutateAsync({
        status: "lost",
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        date: item.date,
        imageUrl: item.imageUrl,
        contactEmail: item.contactEmail,
        contactPhone: item.contactPhone
      });
      
      toast({
        title: "Success",
        description: "Your lost item has been reported successfully.",
      });
      
      setActiveTab("browse");
    } catch (error) {
      console.error("Error saving lost item:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your lost item report.",
        variant: "destructive",
      });
    }
  };

  const handleFoundItemSubmit = async (item: ItemDetailsType) => {
    try {
      await createItemMutation.mutateAsync({
        status: "found",
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        date: item.date,
        imageUrl: item.imageUrl,
        contactEmail: item.contactEmail,
        contactPhone: item.contactPhone
      });
      
      toast({
        title: "Success",
        description: "Your found item has been reported successfully.",
      });
      
      setActiveTab("browse");
    } catch (error) {
      console.error("Error saving found item:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your found item report.",
        variant: "destructive",
      });
    }
  };

  const lostItemsCount = items.filter(item => item.status === 'lost').length;
  const foundItemsCount = items.filter(item => item.status === 'found').length;

  const handleGenerateMockData = () => {
    // No changes here
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="bg-gradient-to-r from-[hsl(var(--laf-primary)/0.1)] to-[hsl(var(--laf-secondary)/0.05)] rounded-2xl mb-8 p-6 shadow-sm">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2 text-[hsl(var(--laf-primary))]">
            Lost & Found
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Lost something? Found something? Help reconnect items with their owners.
          </p>
        </div>

        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSoundEffects}
            title={soundEnabled ? "Disable sound effects" : "Enable sound effects"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 mr-2" /> Sound On
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 mr-2" /> Sound Off
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-8">
          <TabsTrigger value="browse" className="flex items-center">
            <Search className="h-4 w-4 mr-2" /> Browse Items
          </TabsTrigger>
          <TabsTrigger value="lost" className="flex items-center bg-[hsl(var(--laf-lost-light))] data-[state=active]:bg-[hsl(var(--laf-lost))] data-[state=active]:text-white">
            <AlertCircle className="h-4 w-4 mr-2" /> Report Lost
          </TabsTrigger>
          <TabsTrigger value="found" className="flex items-center bg-[hsl(var(--laf-found-light))] data-[state=active]:bg-[hsl(var(--laf-found))] data-[state=active]:text-white">
            <CheckCircle className="h-4 w-4 mr-2" /> Report Found
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-[hsl(var(--laf-border))]">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
              <div className="relative w-full md:w-auto flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by keyword, category, or location..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => handleStatusFilter("all")}
                  className={
                    filterStatus === "all"
                      ? "bg-[hsl(var(--laf-primary))] hover:bg-[hsl(var(--laf-secondary))]"
                      : ""
                  }
                  size="sm"
                >
                  All ({items.length})
                </Button>
                <Button
                  variant={filterStatus === "lost" ? "default" : "outline"}
                  onClick={() => handleStatusFilter("lost")}
                  className={
                    filterStatus === "lost" ? "bg-[hsl(var(--laf-lost))] hover:bg-[hsl(var(--laf-lost))]" : ""
                  }
                  size="sm"
                >
                  Lost ({lostItemsCount})
                </Button>
                <Button
                  variant={filterStatus === "found" ? "default" : "outline"}
                  onClick={() => handleStatusFilter("found")}
                  className={
                    filterStatus === "found"
                      ? "bg-[hsl(var(--laf-found))] hover:bg-[hsl(var(--laf-found))]"
                      : ""
                  }
                  size="sm"
                >
                  Found ({foundItemsCount})
                </Button>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Tag className="h-4 w-4 mr-1" /> Categories:
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={categoryFilter === "all" ? "default" : "outline"}
                    className={`cursor-pointer ${
                      categoryFilter === "all" ? "bg-[hsl(var(--laf-primary))]" : ""
                    }`}
                    onClick={() => handleCategoryFilter("all")}
                  >
                    All Categories
                  </Badge>
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={categoryFilter === category ? "default" : "outline"}
                      className={`cursor-pointer ${
                        categoryFilter === category ? "bg-[hsl(var(--laf-primary))]" : ""
                      }`}
                      onClick={() => handleCategoryFilter(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-500" />
                <p className="text-gray-500">Loading items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900">No items found</h3>
                <p className="mt-2 text-gray-500">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button 
                  className="mt-4 bg-[hsl(var(--laf-primary))]" 
                  onClick={handleGenerateMockData}
                >
                  Refresh Data
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {filterStatus === "all" 
                      ? "All Items" 
                      : filterStatus === "lost" 
                        ? "Lost Items" 
                        : "Found Items"
                    }
                  </h2>
                  <p className="text-sm text-gray-500">
                    Showing {filteredItems.length} of {items.length} items
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onContactClick={handleContactClick}
                      onViewDetails={handleItemClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {potentialMatches.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center mb-4">
                <Bell className="text-[hsl(var(--laf-primary))] mr-2 animate-pulse" />
                <h2 className="text-xl font-semibold">Potential Matches</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {potentialMatches.map((match, index) => {
                  const matchedItem = items.find(item => 
                    item.id === match.id
                  );
                  
                  const originalItem = selectedItem || 
                    (items.find(item => item.status !== match.status));
                  
                  if (!matchedItem || !originalItem) return null;
                  
                  const lostItem = originalItem.status === 'lost' ? originalItem : matchedItem;
                  const foundItem = originalItem.status === 'found' ? originalItem : matchedItem;
                  
                  return (
                    <div key={index} className="border border-[hsl(var(--laf-border))] bg-white rounded-xl shadow-sm p-6 relative overflow-hidden">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium mb-2 flex items-center">
                            <span className="bg-[hsl(var(--laf-lost))] text-white text-xs px-2 py-0.5 rounded mr-2">LOST</span>
                            {lostItem.title}
                          </h3>
                          <div className="relative h-32 overflow-hidden rounded-md">
                            <img 
                              src={lostItem.imageUrl} 
                              alt={lostItem.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 line-clamp-2">{lostItem.description}</p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" /> {lostItem.location}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center md:flex-col my-2 md:my-0">
                          <div className="py-2 px-3 bg-[hsl(var(--laf-primary)/0.1)] rounded-full text-[hsl(var(--laf-primary))]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </div>
                          <Badge className="mt-2 bg-[hsl(var(--laf-primary))]">
                            {match.matchConfidence}% match
                          </Badge>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-medium mb-2 flex items-center">
                            <span className="bg-[hsl(var(--laf-found))] text-white text-xs px-2 py-0.5 rounded mr-2">FOUND</span>
                            {foundItem.title}
                          </h3>
                          <div className="relative h-32 overflow-hidden rounded-md">
                            <img 
                              src={foundItem.imageUrl} 
                              alt={foundItem.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 line-clamp-2">{foundItem.description}</p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" /> {foundItem.location}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-center">
                        <Button 
                          onClick={() => handleCompareClick(lostItem, foundItem)}
                          className="bg-[hsl(var(--laf-primary))] hover:bg-[hsl(var(--laf-secondary))]"
                        >
                          Compare Items
                        </Button>
                      </div>
                      
                      <div className="absolute top-0 right-0 bg-[hsl(var(--laf-primary))] text-white font-semibold py-1 px-4 shadow-lg transform rotate-[32deg] translate-x-[33%] translate-y-[-10%]">
                        MATCH
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="lost">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-6 border border-[hsl(var(--laf-border))]">
            <div className="flex items-center mb-6 text-[hsl(var(--laf-lost))]">
              <AlertCircle className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-semibold">Report a Lost Item</h2>
            </div>
            <p className="text-gray-500 mb-6">
              Please provide as much detail as possible to help others identify your item.
            </p>
            <EnhancedLostItemForm onSubmitComplete={handleLostItemSubmit} />
          </div>
        </TabsContent>

        <TabsContent value="found">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-6 border border-[hsl(var(--laf-border))]">
            <div className="flex items-center mb-6 text-[hsl(var(--laf-found))]">
              <CheckCircle className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-semibold">Report a Found Item</h2>
            </div>
            <p className="text-gray-500 mb-6">
              By reporting a found item, you're helping someone reunite with their belongings.
            </p>
            <EnhancedFoundItemForm onSubmitComplete={handleFoundItemSubmit} />
          </div>
        </TabsContent>
      </Tabs>

      <ItemDetails
        item={selectedItem}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onContact={handleContactClick}
      />

      <ContactDialog
        item={selectedItem}
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <ImageCompare
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        lostItem={compareItems.lost}
        foundItem={compareItems.found}
      />
    </div>
  );
};

export default LostAndFound;
