
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItemDetails } from "@/types/lost-found";
import { formatDistance } from "date-fns";

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

  // Only show matches badge if matches array exists and has items
  const hasMatches = item.matches && item.matches.length > 0;

  return (
    <Card className="item-card h-full flex flex-col">
      <div className="relative">
        <img 
          src={item.imageUrl} 
          alt={item.title} 
          className="item-image"
        />
        <Badge 
          className={`absolute top-2 right-2 ${
            item.status === "lost" 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {item.status === "lost" ? "Lost" : "Found"}
        </Badge>
        {hasMatches && (
          <Badge className="absolute top-2 left-2 bg-lostfound-primary hover:bg-lostfound-secondary animate-pulse-light">
            Potential Match!
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
        <CardDescription className="text-sm">
          {item.location} • {formattedDate}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
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
          className="flex-1 bg-lostfound-primary hover:bg-lostfound-secondary"
          onClick={() => onContactClick(item)}
        >
          Contact
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ItemCard;
