
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-3xl px-4">
        <h1 className="text-4xl font-bold mb-4 text-lostfound-primary">Picture Perfect Finds</h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect lost items with their owners through our intelligent photo matching system
        </p>
        
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-lostfound-light rounded-lg">
              <div className="w-12 h-12 bg-lostfound-primary rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">1</div>
              <h3 className="font-medium mb-2">Upload a Photo</h3>
              <p className="text-sm text-gray-600">Submit a clear image of your lost or found item</p>
            </div>
            
            <div className="p-4 bg-lostfound-light rounded-lg">
              <div className="w-12 h-12 bg-lostfound-primary rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">2</div>
              <h3 className="font-medium mb-2">Automatic Matching</h3>
              <p className="text-sm text-gray-600">Our system compares images to find potential matches</p>
            </div>
            
            <div className="p-4 bg-lostfound-light rounded-lg">
              <div className="w-12 h-12 bg-lostfound-primary rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">3</div>
              <h3 className="font-medium mb-2">Reconnect</h3>
              <p className="text-sm text-gray-600">Get in touch securely to retrieve your lost items</p>
            </div>
          </div>
        </div>
        
        <Link to="/lost-and-found">
          <Button className="text-lg px-8 py-6 bg-lostfound-primary hover:bg-lostfound-secondary">
            Go to Lost & Found
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
