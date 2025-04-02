
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItemDetails as ItemDetailsType } from "@/types/lost-found";
import { format } from "date-fns";

interface ItemDetailsProps {
  item: ItemDetailsType | null;
  isOpen: boolean;
  onClose: () => void;
  onContact: (item: ItemDetailsType) => void;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({
  item,
  isOpen,
  onClose,
  onContact,
}) => {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.title}
            <Badge
              className={`ml-2 ${
                item.status === "lost"
                  ? "bg-red-500"
                  : "bg-green-500"
              }`}
            >
              {item.status === "lost" ? "Lost" : "Found"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {item.category} • {item.location} •{" "}
            {format(new Date(item.date), "MMMM dd, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-auto rounded-md object-cover max-h-[350px]"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="text-base mt-1">{item.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="text-base mt-1">{item.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {item.status === "lost" ? "Lost On" : "Found On"}
                </h3>
                <p className="text-base mt-1">
                  {format(new Date(item.date), "MMMM dd, yyyy")}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {item.status === "lost" ? "Last Seen At" : "Found At"}
                </h3>
                <p className="text-base mt-1">{item.location}</p>
              </div>
              {item.matches && item.matches.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Potential Matches
                  </h3>
                  <Badge className="mt-1 bg-lostfound-primary">
                    {item.matches.length} possible matches
                  </Badge>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button
                onClick={() => onContact(item)}
                className="w-full bg-lostfound-primary hover:bg-lostfound-secondary"
              >
                Contact {item.status === "lost" ? "Owner" : "Finder"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetails;
