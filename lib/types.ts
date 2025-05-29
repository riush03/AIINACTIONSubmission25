// types.ts
export interface Product {
    id: number;
    title: string;
    price: number;
    image: string;
    rating: number;
    reviews: number;
    category: string;
    discount?: number;
  }
  
  export interface SearchProps {
    onSearch: (query: string) => void;
    searchQuery: string;
    hasSearched: boolean;
  }
  
  export interface SearchResultsProps {
    products: Product[];
    searchQuery: string;
    isLoading: boolean;
  }
  
  export interface ProductCardProps {
    product: Product;
  }