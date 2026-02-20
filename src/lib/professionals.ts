// Available professionals by service type
// This file is separate from the tool to allow client-side imports

export type Professional = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  responseTime: string;
  priceRange: string;
};

export type ProfessionalsByType = {
  plumbing: Professional[];
  electrical: Professional[];
  hvac: Professional[];
  general: Professional[];
};

export const professionals: ProfessionalsByType = {
  plumbing: [
    { id: "quickfix", name: "QuickFix Plumbing", rating: 4.8, reviews: 234, responseTime: "Same day", priceRange: "$" },
    { id: "propipe", name: "ProPipe Services", rating: 4.6, reviews: 189, responseTime: "1-2 days", priceRange: "$" },
  ],
  electrical: [
    { id: "safewire", name: "SafeWire Electric", rating: 4.9, reviews: 312, responseTime: "Same day", priceRange: "$$$" },
    { id: "spark", name: "Spark Masters", rating: 4.5, reviews: 156, responseTime: "1-2 days", priceRange: "$$" },
  ],
  hvac: [
    { id: "coolair", name: "CoolAir HVAC", rating: 4.7, reviews: 278, responseTime: "Same day", priceRange: "$$" },
    { id: "climate", name: "Climate Control Pro", rating: 4.8, reviews: 201, responseTime: "1-3 days", priceRange: "$$$" },
  ],
  general: [
    { id: "handypro", name: "HandyPro Services", rating: 4.5, reviews: 423, responseTime: "Same day", priceRange: "$" },
    { id: "homefixers", name: "HomeFixers Plus", rating: 4.7, reviews: 287, responseTime: "1-2 days", priceRange: "$$" },
  ],
};
