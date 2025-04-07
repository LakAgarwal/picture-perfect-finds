
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItemDetails } from "@/types/lost-found";
import { formatDistance } from "date-fns";
import { MapPin, Bell, Tag, CalendarDays } from "lucide-react";

interface ItemCardProps {
  item: ItemDetails;
  onContactClick: (item: ItemDetails) => void;
  onViewDetails: (item: ItemDetails) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onContactClick, onViewDetails }) => {
  const formattedDate = formatDistance(
    new Date(item.date),
    new Date(),
    { addSuffix: true }
  );

  return (
    <Card className="item-card h-full flex flex-col hover:translate-y-[-4px] transition-all duration-300">
      <div className="relative">
        <img 
          src={item.imageUrl} 
          alt={item.title} 
          className="item-image"
        />
        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between">
          <Badge 
            className={`${
              item.status === "lost" 
                ? "bg-[hsl(var(--laf-lost))] hover:bg-[hsl(var(--laf-lost))]" 
                : "bg-[hsl(var(--laf-found))] hover:bg-[hsl(var(--laf-found))]"
            }`}
          >
            {item.status === "lost" ? "Lost" : "Found"}
          </Badge>

          {item.matches && item.matches.length > 0 && (
            <Badge className="bg-[hsl(var(--laf-primary))] hover:bg-[hsl(var(--laf-secondary))] animate-pulse-light">
              <Bell className="h-3 w-3 mr-1" /> Match
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
        <CardDescription className="text-sm">
          <div className="flex flex-wrap gap-2 mt-1">
            <div className="flex items-center text-xs">
              <MapPin className="h-3 w-3 mr-1" /> {item.location}
            </div>
            <div className="flex items-center text-xs">
              <CalendarDays className="h-3 w-3 mr-1" /> {formattedDate}
            </div>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
        
        {item.category && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Tag className="h-3 w-3" /> {item.category}
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => onViewDetails(item)}
        >
          Details
        </Button>
        <Button 
          variant="default"
          size="sm"
          className="flex-1 bg-[hsl(var(--laf-primary))] hover:bg-[hsl(var(--laf-secondary))]"
          onClick={() => onContactClick(item)}
        >
          Contact
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ItemCard;
