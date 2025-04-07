
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ItemCard from "@/components/ItemCard";
import EnhancedLostItemForm from "@/components/EnhancedLostItemForm";
import EnhancedFoundItemForm from "@/components/EnhancedFoundItemForm";
import ItemDetails from "@/components/ItemDetails";
import ContactDialog from "@/components/ContactDialog";
import ImageCompare from "@/components/ImageCompare";
import { Search } from "lucide-react";
import { ItemDetails as ItemDetailsType, ItemStatus } from "@/types/lost-found";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllItems, createItem, updateItem } from "@/services/lostFoundService";

const LostAndFound: React.FC = () => {
  const [filteredItems, setFilteredItems] = useState<ItemDetailsType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"browse" | "lost" | "found">("browse");
  const [filterStatus, setFilterStatus] = useState<ItemStatus | "all">("all");
  
  const [selectedItem, setSelectedItem] = useState<ItemDetailsType | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareItems, setCompareItems] = useState<{
    lost: ItemDetailsType | null;
    found: ItemDetailsType | null;
  }>({ lost: null, found: null });
  
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lost-found-items'] });
    },
  });

  // Apply filters whenever items, searchQuery or filterStatus changes
  useEffect(() => {
    if (!items) return;
    
    const filtered = items.filter(
      (item) =>
        (filterStatus === "all" || item.status === filterStatus) &&
        (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()))
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
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="browse">Browse Items</TabsTrigger>
          <TabsTrigger value="lost" className="bg-red-50 data-[state=active]:bg-red-100">
            Report Lost Item
          </TabsTrigger>
          <TabsTrigger value="found" className="bg-green-50 data-[state=active]:bg-green-100">
            Report Found Item
          </TabsTrigger>
        </TabsList>

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
              <p className="text-gray-500">Loading items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
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

          {/* Potential Matches Section */}
          {/* This would be dynamic in a real app, here we hardcode a match for demo */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Potential Matches</h2>
            
            <div className="border border-lostfound-light bg-lostfound-light/20 rounded-lg p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded mr-2">LOST</span>
                    Lost Orange Tabby Cat
                  </h3>
                  <img 
                    src="https://images.unsplash.com/photo-1582562124811-c09040d0a901" 
                    alt="Lost Orange Cat"
                    className="w-full h-48 object-cover rounded-md mb-3"
                  />
                  <p className="text-sm">My orange tabby cat went missing from the downtown area. She has a white collar with a bell.</p>
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
                    Found Orange Cat
                  </h3>
                  <img 
                    src="https://images.unsplash.com/photo-1582562124811-c09040d0a901" 
                    alt="Found Orange Cat"
                    className="w-full h-48 object-cover rounded-md mb-3"
                  />
                  <p className="text-sm">Found a friendly orange tabby cat wandering near the park. Has a white collar with bell.</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button 
                  onClick={() => {
                    const lostItem = items.find(item => item.id === "1");
                    const foundItem = items.find(item => item.id === "2");
                    if (lostItem && foundItem) {
                      handleCompareClick(lostItem, foundItem);
                    }
                  }}
                  className="bg-lostfound-primary hover:bg-lostfound-secondary"
                >
                  Compare Items
                </Button>
              </div>
            </div>
          </div>
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
