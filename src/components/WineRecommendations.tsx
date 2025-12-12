import React, { useState, useEffect } from 'react';
import { wineService } from '../services/langchainService';
import './WineRecommendations.css';

interface WineData {
  wine_name: string;
  rating?: number;
  vintage?: number;
  producer?: string;
  region?: string;
  tasting_notes?: string;
}

interface WineRecommendationsProps {
  wineData: WineData;
}

const WineRecommendations: React.FC<WineRecommendationsProps> = ({ wineData }) => {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadRecommendations();
  }, [wineData.wine_name]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecommendations = async () => {
    setLoading(true);
    setError('');
    
    // try {
    //   const recs = await wineService.getWineRecommendations(wineData);
    //   setRecommendations(recs);
    // } catch (err) {
    //   setError('Failed to load recommendations');
    //   console.error('Recommendation error:', err);
    // } finally {
    //   setLoading(false);
    // }
  };

  if (loading) {
    return (
      <div className="wine-recommendations">
        <h3>🍷 Similar Wines You Might Enjoy</h3>
        <div className="loading-recommendations">
          <div className="loading-spinner"></div>
          <p>Finding similar wines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wine-recommendations">
        <h3>🍷 Similar Wines You Might Enjoy</h3>
        <div className="recommendation-error">
          <p>{error}</p>
          <button onClick={loadRecommendations} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wine-recommendations">
      <h3>🍷 Similar Wines You Might Enjoy</h3>
      {recommendations.length > 0 ? (
        <div className="recommendations-grid">
          {recommendations.map((wine, index) => (
            <div key={index} className="recommendation-card">
              <div className="recommendation-number">{index + 1}</div>
              <div className="recommendation-name">{wine}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-recommendations">No recommendations available at the moment.</p>
      )}
    </div>
  );
};

export default WineRecommendations;