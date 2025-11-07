import React, { useState, useEffect } from 'react';
import { wineService } from '../services/langchainService';
import './WineSearch.css';

interface WineData {
  wine_name: string;
  rating?: number;
  vintage?: number;
  producer?: string;
  region?: string;
  tasting_notes?: string;
}

interface WineSearchProps {
  onWineSelect: (wine: WineData) => void;
}

const WineSearch: React.FC<WineSearchProps> = ({ onWineSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WineData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allWines, setAllWines] = useState<WineData[]>([]);

  useEffect(() => {
    loadAllWines();
  }, []);

  const loadAllWines = async () => {
    try {
      const wines = await wineService.searchWines('');
      setAllWines(wines);
      setSearchResults(wines);
    } catch (error) {
      console.error('Error loading wines:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    
    try {
      const results = await wineService.searchWines(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching wines:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wine-search">
      <div className="search-header">
        <h2>🍷 Wine Database</h2>
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search wines by name, producer, region, or tasting notes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          {isLoading && <div className="search-loading">Searching...</div>}
        </div>
      </div>

      <div className="search-results">
        {searchResults.length === 0 ? (
          <div className="no-results">
            {searchQuery ? 'No wines found matching your search.' : 'No wines available.'}
          </div>
        ) : (
          <div className="wine-grid">
            {searchResults.map((wine, index) => (
              <div key={index} className="wine-card" onClick={() => onWineSelect(wine)}>
                <div className="wine-header">
                  <h3>{wine.wine_name}</h3>
                  {wine.rating && (
                    <span className="wine-rating">{wine.rating}/100</span>
                  )}
                </div>
                <div className="wine-details">
                  <p><strong>Producer:</strong> {wine.producer || 'Unknown'}</p>
                  <p><strong>Region:</strong> {wine.region || 'Unknown'}</p>
                  {wine.vintage && (
                    <p><strong>Vintage:</strong> {wine.vintage}</p>
                  )}
                  {wine.tasting_notes && (
                    <p className="tasting-notes">
                      <strong>Notes:</strong> {wine.tasting_notes.substring(0, 100)}
                      {wine.tasting_notes.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
                <button className="select-wine-btn">Select Wine</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WineSearch;