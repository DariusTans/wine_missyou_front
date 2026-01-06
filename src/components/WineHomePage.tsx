import React, { useState } from 'react';
import './WineHomePage.css';

interface WineData {
  success: boolean;
  search_query: string;
  match: {
    wine_id: number;
    vintage_id: number;
    name: string;
    year: number;
    type: number;
    rating: number;
    ratings_count: number;
    winery_name: string;
    region_name: string;
    country: string;
    country_code: string;
    image_url: string;
    price_amount: number;
    price_currency: string;
    vivino_url: string;
    match_score: number;
  };
  full_data: {
    wine: {
      description: string;
      alcohol: number;
      grapes: Array<{ name: string }>;
      foods: Array<{
        name: string;
        background_image: { location: string };
      }>;
      style: {
        name: string;
        description: string;
        body_description: string;
        acidity_description: string;
      };
    };
    vintage: {
      ratings_distribution: {
        [key: string]: number;
      };
    };
    highlights: Array<{
      message: string;
      icon: string;
      vintage_year: number;
    }>;
    recommended_vintages: Array<{
      vintage: {
        name: string;
        year: number;
        statistics: {
          ratings_average: number;
          ratings_count: number;
        };
      };
      type: string;
      highlight_icon: string;
    }>;
  };
}

interface SearchParams {
  wine_name: string;
  min_similarity: number;
  currency_code: string;
  price_range_max: number;
}

const WineHomePage: React.FC = () => {
  const [wineData, setWineData] = useState<WineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [searchParams, setSearchParams] = useState<SearchParams>({
    wine_name: "Feudi Bizantini Il Rabdomante Montepulciano d'Abruzzo",
    min_similarity: 0.4,
    currency_code: "THB",
    price_range_max: 1000
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: name === 'wine_name' || name === 'currency_code' ? value : Number(value)
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.wine_name.trim()) {
      setError('Please enter a wine name');
      return;
    }
    await fetchWineData(searchParams);
  };

  const fetchWineData = async (params: SearchParams) => {
    try {
      setLoading(true);
      setError(null);
      setWineData(null);

      const response = await fetch('http://http://43.209.187.16:7000/api/v1/wine/demo_vivino', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch wine data`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error_message || 'Failed to find wine data');
      }

      if (!data.full_data) {
        throw new Error('Wine found but detailed information is not available. Try a different wine name.');
      }

      setWineData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching wine data');
      setWineData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">★</span>);
    }

    return stars;
  };

  const renderRatingDistribution = (distribution: { [key: string]: number }) => {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    return Object.entries(distribution)
      .reverse()
      .map(([rating, count]) => {
        const percentage = (count / total) * 100;
        return (
          <div key={rating} className="rating-bar">
            <span className="rating-label">{rating}★</span>
            <div className="bar-container">
              <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
            </div>
            <span className="rating-count">{count}</span>
          </div>
        );
      });
  };

  return (
    <div className="wine-home-page">
      {/* Search Section */}
      <section className="search-section">
        <div className="search-container">
          <h1 className="search-title">🍷 Wine Discovery</h1>
          <p className="search-subtitle">Search for your favorite wines from around the world</p>

          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                name="wine_name"
                value={searchParams.wine_name}
                onChange={handleInputChange}
                placeholder="Enter wine name (e.g., Chateau Margaux 2015)"
                className="search-input"
                disabled={loading}
              />
              <button type="submit" className="search-button" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="advanced-toggle"
            >
              {showAdvanced ? '▼' : '▶'} Advanced Options
            </button>

            {showAdvanced && (
              <div className="advanced-options">
                <div className="option-group">
                  <label htmlFor="min_similarity">Minimum Similarity</label>
                  <input
                    type="number"
                    id="min_similarity"
                    name="min_similarity"
                    value={searchParams.min_similarity}
                    onChange={handleInputChange}
                    min="0"
                    max="1"
                    step="0.1"
                    className="option-input"
                    disabled={loading}
                  />
                  <span className="option-hint">0.0 - 1.0 (higher = more strict)</span>
                </div>

                <div className="option-group">
                  <label htmlFor="currency_code">Currency</label>
                  <input
                    type="text"
                    id="currency_code"
                    name="currency_code"
                    value={searchParams.currency_code}
                    onChange={handleInputChange}
                    className="option-input"
                    disabled={loading}
                    placeholder="THB"
                  />
                </div>

                <div className="option-group">
                  <label htmlFor="price_range_max">Max Price</label>
                  <input
                    type="number"
                    id="price_range_max"
                    name="price_range_max"
                    value={searchParams.price_range_max}
                    onChange={handleInputChange}
                    min="0"
                    step="100"
                    className="option-input"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </form>

          {error && (
            <div className="search-error">
              <p>❌ {error}</p>
              <p className="error-hint">💡 Try using simpler wine names or check if your backend server is running on port 7000</p>
            </div>
          )}
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="loading-section">
          <div className="wine-glass-loader">
            <div className="wine"></div>
          </div>
          <p>Searching for the perfect wine...</p>
        </div>
      )}

      {/* Wine Results */}
      {!loading && wineData && wineData.success && (() => {
        const { match, full_data } = wineData;
        return (
          <>
            <div className="results-divider">
              <span className="results-badge">Search Results</span>
            </div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="wine-image-container">
            <img
              src={`https:${match.image_url}`}
              alt={match.name}
              className="wine-bottle-image"
            />
          </div>
          <div className="hero-info">
            <div className="wine-header">
              <h1 className="wine-name">{match.name}</h1>
              <span className="wine-year">{match.year}</span>
            </div>
            <p className="winery-name">{match.winery_name}</p>
            <p className="region-info">
              {match.region_name}, {match.country}
            </p>

            <div className="rating-section">
              <div className="rating-display">
                <span className="rating-number">{match.rating.toFixed(1)}</span>
                <div className="stars-container">
                  {renderStars(match.rating)}
                </div>
              </div>
              <span className="ratings-count">{match.ratings_count.toLocaleString()} ratings</span>
            </div>

            <div className="price-section">
              <span className="price-label">Price:</span>
              <span className="price-amount">
                {match.price_currency} {match.price_amount.toLocaleString()}
              </span>
            </div>

            <a
              href={match.vivino_url}
              target="_blank"
              rel="noopener noreferrer"
              className="vivino-link"
            >
              View on Vivino →
            </a>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      {full_data.highlights && full_data.highlights.length > 0 && (
        <section className="highlights-section">
          <h2 className="section-title">Awards & Highlights</h2>
          <div className="highlights-grid">
            {full_data.highlights.slice(0, 4).map((highlight, index) => (
              <div key={index} className="highlight-card">
                <img src={`https:${highlight.icon}`} alt="" className="highlight-icon" />
                <p className="highlight-message">{highlight.message}</p>
                {highlight.vintage_year && (
                  <span className="highlight-year">{highlight.vintage_year}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Wine Details Grid */}
      <div className="details-grid">
        {/* Wine Profile */}
        <section className="wine-profile-section card">
          <h2 className="section-title">Wine Profile</h2>
          <div className="profile-details">
            <div className="profile-item">
              <span className="profile-label">Alcohol:</span>
              <span className="profile-value">{full_data.wine.alcohol}%</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Body:</span>
              <span className="profile-value">{full_data.wine.style.body_description}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Acidity:</span>
              <span className="profile-value">{full_data.wine.style.acidity_description}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Style:</span>
              <span className="profile-value">{full_data.wine.style.name}</span>
            </div>
          </div>

          {full_data.wine.grapes && full_data.wine.grapes.length > 0 && (
            <div className="grapes-section">
              <h3>Grapes</h3>
              <div className="grapes-list">
                {full_data.wine.grapes.map((grape, index) => (
                  <span key={index} className="grape-tag">{grape.name}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Rating Distribution */}
        <section className="rating-distribution-section card">
          <h2 className="section-title">Rating Distribution</h2>
          <div className="distribution-bars">
            {renderRatingDistribution(full_data.vintage.ratings_distribution)}
          </div>
          <p className="total-ratings">
            Total: {Object.values(full_data.vintage.ratings_distribution).reduce((a, b) => a + b, 0)} ratings
          </p>
        </section>
      </div>

      {/* Food Pairings */}
      {full_data.wine.foods && full_data.wine.foods.length > 0 && (
        <section className="food-pairings-section">
          <h2 className="section-title">Food Pairings</h2>
          <div className="food-grid">
            {full_data.wine.foods.map((food, index) => (
              <div key={index} className="food-card">
                <img
                  src={`https:${food.background_image.location}`}
                  alt={food.name}
                  className="food-image"
                />
                <p className="food-name">{food.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Wine Description */}
      {full_data.wine.style.description && (
        <section className="description-section card">
          <h2 className="section-title">About This Wine</h2>
          <p className="wine-description">{full_data.wine.style.description}</p>
        </section>
      )}

      {/* Recommended Vintages */}
      {full_data.recommended_vintages && full_data.recommended_vintages.length > 0 && (
        <section className="recommended-vintages-section">
          <h2 className="section-title">Recommended Vintages</h2>
          <div className="vintages-grid">
            {full_data.recommended_vintages.map((item, index) => (
              <div key={index} className="vintage-card">
                <img
                  src={`https:${item.highlight_icon}`}
                  alt={item.type}
                  className="vintage-icon"
                />
                <h3 className="vintage-year">{item.vintage.year}</h3>
                <div className="vintage-rating">
                  <span className="vintage-rating-value">
                    {item.vintage.statistics.ratings_average.toFixed(1)}
                  </span>
                  {renderStars(item.vintage.statistics.ratings_average)}
                </div>
                <p className="vintage-ratings-count">
                  {item.vintage.statistics.ratings_count} ratings
                </p>
                <span className="vintage-type">{item.type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}
          </>
        );
      })()}

      {/* No Results State */}
      {!loading && !wineData && !error && (
        <div className="no-results">
          <div className="no-results-icon">🍇</div>
          <h3>Ready to discover wines?</h3>
          <p>Enter a wine name above to start your search</p>
        </div>
      )}
    </div>
  );
};

export default WineHomePage;
