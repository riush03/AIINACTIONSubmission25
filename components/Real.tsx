'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, Camera, ShoppingCart, Star, Loader2, X, Image, Mic } from 'lucide-react';

// TypeScript interfaces
interface SearchResult {
  content: string;
  link?: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalResults: number;
  searchTime: number;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
}

interface ImageState {
  file: File | null;
  preview: string | null;
}

interface PlaceholderState {
  index: number;
  isTransitioning: boolean;
}

interface VoiceState {
  isListening: boolean;
  recognition: any | null;
  isSupported: boolean;
}

interface SearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  isTransitioning: boolean;
  placeholderText: string;
  isListening: boolean;
  isVoiceSupported: boolean;
  onVoiceSearch: () => void;
  onImageUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ImagePreviewProps {
  imagePreview: string;
  searchQuery: string;
  onClearImage: () => void;
}

interface ErrorMessageProps {
  message: string;
}

interface SearchResultsProps {
  results: SearchResult[];
}

// API functions
const searchProducts = async (query: string): Promise<SearchResponse> => {
  const response = await fetch(
    `https://bacendsimu-868683941669.us-east1.run.app/api/search?q=${encodeURIComponent(query)}`
  );
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  console.log("Text search results:", data.results);
  return data;
};

const searchWithImage = async (file: File, query: string): Promise<SearchResponse> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('query', query);

  const response = await fetch('https://bacendsimu-868683941669.us-east1.run.app/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Image search failed with status ${response.status}`);
  }

  const data = await response.json();
  console.log("Image search results:", data.results);
  return data;
};

// Logo Component
const SmartSearchLogo: React.FC = () => {
  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg transform rotate-12"></div>
        <div className="absolute -top-1 -left-1 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg"></div>
      </div>
      <span className="text-2xl font-bold text-gray-900">SmartSearch</span>
    </div>
  );
};

// Animated Background Component
const AnimatedBackground: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const products = [
    "📱", "💻", "🎧", "⌚", "📷", "🖱️", "⌨️", "🖥️", "📺", "🎮",
    "👟", "👕", "👖", "🧥", "👒", "👜", "🕶️", "💍", "📚", "✏️",
    "🏠", "🛋️", "🪑", "🛏️", "🚗", "🏃‍♀️", "🧘‍♀️", "🏋️‍♂️", "⚽", "🎾"
  ];

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-4xl animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        >
          {products[Math.floor(Math.random() * products.length)]}
        </div>
      ))}
    </div>
  );
};

// Search Input Component
const SearchInput: React.FC<SearchInputProps> = ({
  searchQuery,
  setSearchQuery,
  isLoading,
  isTransitioning,
  placeholderText,
  isListening,
  isVoiceSupported,
  onVoiceSearch,
  onImageUpload,
  fileInputRef,
  onImageChange,
}) => {
  return (
    <div className="search-box relative mb-6">
      <input
        type="text"
        className={`search-input w-full px-6 py-6 pr-48 text-xl border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${
          isTransitioning ? "placeholder-fade-out" : "placeholder-fade-in"
        }`}
        placeholder={placeholderText}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={isLoading}
      />
      
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
        {/* Voice Button */}
        {isVoiceSupported && (
          <button
            type="button"
            className={`voice-button p-3 rounded-xl transition-colors ${
              isListening 
                ? "bg-red-100 text-red-600 hover:bg-red-200" 
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            onClick={onVoiceSearch}
            disabled={isLoading}
            title={isListening ? "Stop voice input" : "Start voice input"}
          >
            {isListening ? (
              <>
                <div className="listening-indicator absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="w-6 h-6 bg-red-600 rounded-sm" />
              </>
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        )}
        
        {/* Image Upload Button */}
        <button
          type="button"
          onClick={onImageUpload}
          className="image-button p-3 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
          disabled={isLoading}
          title="Upload an image"
        >
          <Image className="w-6 h-6" />
        </button>
        
        {/* Search Button */}
        <button
          type="submit"
          className="search-button p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="loading-spinner w-6 h-6 animate-spin" />
          ) : (
            <Search className="search-icon w-6 h-6" />
          )}
        </button>
      </div>
      
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png, image/gif"
        onChange={onImageChange}
        style={{ display: "none" }}
      />
    </div>
  );
};

// Image Preview Component
const ImagePreview: React.FC<ImagePreviewProps> = ({
  imagePreview,
  searchQuery,
  onClearImage,
}) => {
  return (
    <div className="image-preview-container mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-start space-x-4">
        <div className="relative">
          <img
            src={imagePreview}
            alt="Upload preview"
            className="w-20 h-20 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={onClearImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">
            Searching with uploaded image
          </p>
          <p className="text-lg font-medium text-gray-900">
            {searchQuery || "Find products like this"}
          </p>
        </div>
      </div>
    </div>
  );
};

// Error Message Component
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="error-message bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6">
      {message}
    </div>
  );
};

// Product Card Component
const ResultCard: React.FC<{ result: SearchResult; index: number }> = ({ result, index }) => {
  // Extract data from the content string
  const titleMatch = result.content.match(/Title: (.*?)(?:\n|$)/);
  const priceMatch = result.content.match(/Price: (.*?)(?:\n|$)/);
  const ratingMatch = result.content.match(/Rating: (.*?)(?:\n|$)/);
  
  const title = titleMatch ? titleMatch[1] : "Product";
  const price = priceMatch ? priceMatch[1] : "Price not available";
  const rating = ratingMatch ? ratingMatch[1] : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group p-6 animate-fadeIn"
         style={{ animationDelay: `${index * 0.1}s` }}>
      <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 text-lg leading-tight">
        {title}
      </h3>
      
      <div className="text-2xl font-bold text-green-600 mb-3">
        {price}
      </div>
      
      {rating && (
        <div className="text-sm text-gray-600 mb-4">
          Rating: {rating}
        </div>
      )}
      
      {result.link && (
        <button
          onClick={() => window.open(result.link, '_blank')}
          className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium"
        >
          View Product
        </button>
      )}
    </div>
  );
};

// Search Results Component
const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  return (
    <div className="search-results-container bg-white rounded-3xl shadow-lg p-8 border border-gray-100 mb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Search Results</h2>
        <p className="text-gray-600">
          Found {results.length} results
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {results.map((result, index) => (
          <ResultCard key={index} result={result} index={index} />
        ))}
      </div>
    </div>
  );
};

// Main Search Engine Component
const SmartSearchEngine: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    results: [],
    isLoading: false,
    error: null,
  });

  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    preview: null,
  });

  const [placeholderState, setPlaceholderState] = useState<PlaceholderState>({
    index: 0,
    isTransitioning: false,
  });

  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    recognition: null,
    isSupported: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const placeholderTexts = [
    "What would be a good gift for my 15 year old cousin?",
    "I need a birthday present for my mom",
    "Looking for a graduation gift",
    "What's a good anniversary gift?",
    "Need ideas for a housewarming present",
    "I want to buy some not red shirts",
    "Show me my dream watch",
  ];

  // Initialize client-side features after mount
  useEffect(() => {
    setMounted(true);
    
    // Check for voice recognition support
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setVoiceState(prev => ({ ...prev, isSupported: true }));
    }
  }, []);

  // Effect to cycle through placeholder texts with animation
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      // Start fade out
      setPlaceholderState((prev) => ({ ...prev, isTransitioning: true }));

      // After fade out, change text and start fade in
      setTimeout(() => {
        setPlaceholderState((prev) => ({
          index: (prev.index + 1) % placeholderTexts.length,
          isTransitioning: false,
        }));
      }, 500); // Half of the transition time
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [mounted, placeholderTexts.length]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchState.query.trim() && !imageState.file) {
      setSearchState((prev) => ({
        ...prev,
        error: "Please enter a search query or upload an image",
      }));
      return;
    }

    setSearchState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      results: [],
    }));

    try {
      let data: SearchResponse;

      // If there's an image file, use the image upload endpoint
      if (imageState.file) {
        data = await searchWithImage(
          imageState.file,
          searchState.query || "Find products like this"
        );
      } else {
        // Otherwise use the regular search endpoint
        data = await searchProducts(searchState.query);
      }

      setSearchState((prev) => ({
        ...prev,
        results: data.results,
      }));
    } catch (err) {
      console.error("Error fetching search results:", err);
      setSearchState((prev) => ({
        ...prev,
        error: "Failed to fetch search results. Please try again.",
      }));
    } finally {
      setSearchState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSearchState((prev) => ({
        ...prev,
        error: "Image size exceeds 5MB limit",
      }));
      return;
    }

    // Check file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setSearchState((prev) => ({
        ...prev,
        error: "Invalid file type. Please use JPG, PNG, or GIF",
      }));
      return;
    }

    setImageState({ file, preview: null });
    setSearchState((prev) => ({ ...prev, error: null }));

    // Create image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageState((prev) => ({ ...prev, preview: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageState({ file: null, preview: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const startVoiceSearch = () => {
    if (!voiceState.isSupported) {
      setSearchState((prev) => ({
        ...prev,
        error: "Voice search is not supported in your browser",
      }));
      return;
    }

    const recognitionInstance = new (window as any).webkitSpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onstart = () => {
      setVoiceState(prev => ({ ...prev, isListening: true, recognition: recognitionInstance }));
      setSearchState((prev) => ({ ...prev, error: null }));
    };

    recognitionInstance.onerror = (event: any) => {
      setVoiceState(prev => ({ ...prev, isListening: false, recognition: null }));
      setSearchState((prev) => ({
        ...prev,
        error: "Error occurred in voice recognition: " + event.error,
      }));
    };

    recognitionInstance.onend = () => {
      setVoiceState(prev => ({ ...prev, isListening: false, recognition: null }));
    };

    recognitionInstance.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(" ");
      setSearchState((prev) => ({ ...prev, query: transcript }));
    };

    recognitionInstance.start();
  };

  const stopVoiceSearch = () => {
    if (voiceState.recognition) {
      voiceState.recognition.stop();
    }
  };

  // Show a minimal loading state during SSR
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <SmartSearchLogo />
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Products</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Categories</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
            </nav>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16 mb-16">
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Let's find your{' '}
              <span className="text-[#780000]">next</span>{' '}
              purchase.
            </h1>
            <h2 className="text-center text-lg text-gray-600 mb-6 font-medium">
              Search by <i>text</i>, <i>voice</i>, or <i>image</i> to find{' '}
              <b>exactly what you want</b>, even without knowing exactly what you're
              looking for!
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
                <div className="relative mb-6">
                  <input
                    type="text"
                    className="w-full px-6 py-6 pr-48 text-xl border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="Loading..."
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <AnimatedBackground />
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .search-box {
          position: relative;
        }
        
        .search-input {
          transition: all 0.3s ease;
        }
        
        .placeholder-fade-in {
          animation: placeholderFadeIn 0.3s ease-in-out;
        }
        
        .placeholder-fade-out {
          animation: placeholderFadeOut 0.3s ease-in-out;
        }
        
        @keyframes placeholderFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes placeholderFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        .voice-button:hover,
        .image-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .search-button:disabled {
          cursor: not-allowed;
        }
        
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes bounce-subtle {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-5px);
          }
          60% {
            transform: translateY(-3px);
          }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <SmartSearchLogo />
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Products</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Categories</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="search-container text-center py-16 mb-16">
          <h1 className="search-title text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Let's find your{' '}
            <span className="text-[#780000] animate-bounce-subtle">next</span>{' '}
            purchase.
          </h1>
          <h2 className="text-center text-lg text-gray-600 mb-6 font-medium">
            Search by <i>text</i>, <i>voice</i>, or <i>image</i> to find{' '}
            <b>exactly what you want</b>, even without knowing exactly what you're
            looking for!
          </h2>

          {/* Search Form */}
          <div className="search-box-container max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <form onSubmit={handleSearch}>
                <SearchInput
                  searchQuery={searchState.query}
                  setSearchQuery={(query) =>
                    setSearchState((prev) => ({ ...prev, query }))
                  }
                  isLoading={searchState.isLoading}
                  isTransitioning={placeholderState.isTransitioning}
                  placeholderText={placeholderTexts[placeholderState.index]}
                  isListening={voiceState.isListening}
                  isVoiceSupported={voiceState.isSupported}
                  onVoiceSearch={
                    voiceState.isListening ? stopVoiceSearch : startVoiceSearch
                  }
                  onImageUpload={triggerFileInput}
                  fileInputRef={fileInputRef}
                  onImageChange={handleImageChange}
                />

                {imageState.preview && (
                  <ImagePreview
                    imagePreview={imageState.preview}
                    searchQuery={searchState.query}
                    onClearImage={clearImage}
                  />
                )}
              </form>
            </div>
          </div>

          {searchState.error && <ErrorMessage message={searchState.error} />}
        </div>

        {/* Loading State */}
        {searchState.isLoading && (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Searching for products...</p>
          </div>
        )}

        {/* Search Results */}
        {searchState.results.length > 0 && !searchState.isLoading && (
          <SearchResults results={searchState.results} />
        )}

        {/* Empty State */}
        {!searchState.isLoading && searchState.results.length === 0 && searchState.query && (
          <div className="text-center py-16">
            <Search className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              No products found
            </h3>
            <p className="text-gray-600 text-lg">
              Try adjusting your search terms or using different keywords
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSearchEngine;