
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, AlertCircle } from "lucide-react";
import ItemCard from "@/components/ItemCard";
import EnhancedLostItemForm from "@/components/EnhancedLostItemForm";
import EnhancedFoundItemForm from "@/components/EnhancedFoundItemForm";
import ItemDetails from "@/components/ItemDetails";
import ContactDialog from "@/components/ContactDialog";
import ImageCompare from "@/components/ImageCompare";
import { ItemDetails as ItemDetailsType, ItemStatus } from "@/types/lost-found";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllItems, createItem, updateItem, findPotentialMatches } from "@/services/lostFoundService";

const LostAndFound: React.FC = () => {
  const [filteredItems, setFilteredItems] = useState<ItemDetailsType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"browse" | "lost" | "found" | "lost-items" | "found-items">("browse");
  const [filterStatus, setFilterStatus] = useState<ItemStatus | "all">("all");
  
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

  // Fetch all items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['lost-found-items'],
    queryFn: () => getAllItems(),
  });
  
  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: createItem,
    onSuccess: async (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['lost-found-items'] });
      
      if (newItem) {
        // Find potential matches for the new item
        setIsMatchesLoading(true);
        try {
          const matches = await findPotentialMatches(newItem);
          setPotentialMatches(matches);
          
          if (matches.length > 0) {
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

  // Apply filters whenever items, searchQuery or filterStatus changes
  useEffect(() => {
    if (!items) return;
    
    const filtered = items.filter(
      (item) => {
        // Apply status filter first
        const statusMatch = filterStatus === "all" || item.status === filterStatus;
        if (!statusMatch) return false;
        
        // Then apply text search if any
        if (searchQuery.trim() === '') return true;
        
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
        );
      }
    );
    
    setFilteredItems(filtered);
  }, [items, searchQuery, filterStatus]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: ItemStatus | "all") => {
    setFilterStatus(status);
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

  // Get counts for lost and found items
  const lostItemsCount = items.filter(item => item.status === 'lost').length;
  const foundItemsCount = items.filter(item => item.status === 'found').length;
  
  // Filter for lost/found items views
  const lostItems = items.filter(item => item.status === 'lost');
  const foundItems = items.filter(item => item.status === 'found');

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-lostfound-primary">
          Lost & Found
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Lost something? Found something? Help reconnect items with their owners.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="lost-items" className="bg-red-50 data-[state=active]:bg-red-100">
            Lost Items ({lostItemsCount})
          </TabsTrigger>
          <TabsTrigger value="found-items" className="bg-green-50 data-[state=active]:bg-green-100">
            Found Items ({foundItemsCount})
          </TabsTrigger>
          <TabsTrigger value="lost" className="bg-red-50 data-[state=active]:bg-red-100">
            Report Lost
          </TabsTrigger>
          <TabsTrigger value="found" className="bg-green-50 data-[state=active]:bg-green-100">
            Report Found
          </TabsTrigger>
        </TabsList>

        {/* Browse All Tab */}
        <TabsContent value="browse" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-auto flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by keyword, category, or location..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => handleStatusFilter("all")}
                className={
                  filterStatus === "all"
                    ? "bg-lostfound-primary hover:bg-lostfound-secondary"
                    : ""
                }
              >
                All
              </Button>
              <Button
                variant={filterStatus === "lost" ? "default" : "outline"}
                onClick={() => handleStatusFilter("lost")}
                className={
                  filterStatus === "lost" ? "bg-red-500 hover:bg-red-600" : ""
                }
              >
                Lost
              </Button>
              <Button
                variant={filterStatus === "found" ? "default" : "outline"}
                onClick={() => handleStatusFilter("found")}
                className={
                  filterStatus === "found"
                    ? "bg-green-500 hover:bg-green-600"
                    : ""
                }
              >
                Found
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-500" />
              <p className="text-gray-500">Loading items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">No items found</h3>
              <p className="mt-2 text-gray-500">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onContactClick={handleContactClick}
                  onViewDetails={handleItemClick}
                />
              ))}
            </div>
          )}

          {/* Potential Matches Section will be dynamically populated based on selections */}
          {potentialMatches.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold mb-4">Potential Matches</h2>
              
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
                  <div key={index} className="border border-lostfound-light bg-lostfound-light/20 rounded-lg p-6 mb-4">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded mr-2">LOST</span>
                          {lostItem.title}
                        </h3>
                        <img 
                          src={lostItem.imageUrl} 
                          alt={lostItem.title}
                          className="w-full h-48 object-cover rounded-md mb-3"
                        />
                        <p className="text-sm">{lostItem.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <div className="py-4 px-2 bg-lostfound-primary/20 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-lostfound-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded mr-2">FOUND</span>
                          {foundItem.title}
                        </h3>
                        <img 
                          src={foundItem.imageUrl} 
                          alt={foundItem.title}
                          className="w-full h-48 object-cover rounded-md mb-3"
                        />
                        <p className="text-sm">{foundItem.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                      <Badge className="mb-2">
                        Match confidence: {match.matchConfidence}%
                      </Badge>
                      
                      <div>
                        <Button 
                          onClick={() => handleCompareClick(lostItem, foundItem)}
                          className="bg-lostfound-primary hover:bg-lostfound-secondary"
                        >
                          Compare Items
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        {/* Lost Items Tab */}
        <TabsContent value="lost-items" className="space-y-6">
          <div className="relative w-full mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search lost items..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-500" />
              <p className="text-gray-500">Loading lost items...</p>
            </div>
          ) : lostItems.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">No lost items found</h3>
              <p className="mt-2 text-gray-500">
                No one has reported any lost items yet.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4 text-red-600">Lost Items</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {lostItems
                  .filter(item => 
                    searchQuery === '' || 
                    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.location.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onContactClick={handleContactClick}
                      onViewDetails={handleItemClick}
                    />
                  ))}
              </div>
            </>
          )}
        </TabsContent>
        
        {/* Found Items Tab */}
        <TabsContent value="found-items" className="space-y-6">
          <div className="relative w-full mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search found items..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-500" />
              <p className="text-gray-500">Loading found items...</p>
            </div>
          ) : foundItems.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">No found items</h3>
              <p className="mt-2 text-gray-500">
                No one has reported any found items yet.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4 text-green-600">Found Items</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {foundItems
                  .filter(item => 
                    searchQuery === '' || 
                    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.location.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onContactClick={handleContactClick}
                      onViewDetails={handleItemClick}
                    />
                  ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="lost">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-2">Report a Lost Item</h2>
            <p className="text-gray-500 mb-6">
              Please provide as much detail as possible to help others identify your item.
            </p>
            <EnhancedLostItemForm onSubmitComplete={handleLostItemSubmit} />
          </div>
        </TabsContent>

        <TabsContent value="found">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-2">Report a Found Item</h2>
            <p className="text-gray-500 mb-6">
              By reporting a found item, you're helping someone reunite with their belongings.
            </p>
            <EnhancedFoundItemForm onSubmitComplete={handleFoundItemSubmit} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
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
