import React, { useState, useRef } from 'react';
import './WineScanner.css';
import WineBlend from './WineBlend';
import WineReviews from './WineReviews';
import ThaiFoodPairing from './ThaiFoodPairing';
import WineRecommendations from './WineRecommendations';
import ReviewSentimentAnalysis from './ReviewSentimentAnalysis';
import WineChatAssistant from './WineChatAssistant';
import WineSearch from './WineSearch';
import { wineService, EnhancedWineData, WineAnalysisResult } from '../services/langchainService';

interface BlendVariety {
  grape: string;
  percentage: number;
}

interface CriticReview {
  critic: string;
  publication?: string;
  rating: number;
  maxRating?: number;
  review: string;
  reviewDate?: string;
}

interface PairingDish {
  name: string;
  nameInThai: string;
  description: string;
  spiceLevel: 'mild' | 'medium' | 'hot';
  pairingReason: string;
}

interface WineRating {
  wine_name: string;
  rating?: number;
  vintage?: number;
  producer?: string;
  region?: string;
  tasting_notes?: string;
  review_date?: string;
  price?: string;
  source_url?: string;
  found: boolean;
  error_message?: string;
  blend?: BlendVariety[];
  reviews?: CriticReview[];
  thaiFoodPairings?: PairingDish[];
  // New fields from real API
  grape_varieties?: string[];
  scores?: string;
  pricing?: string;
  full_reviews?: string;
  references?: string;
}

const WineScanner: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [result, setResult] = useState<WineRating | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedWineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string>('');
  const [useMockData, setUseMockData] = useState(false);
  const [useAIEnhancement, setUseAIEnhancement] = useState(true);
  const [showWineSearch, setShowWineSearch] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'normal' | 'advance'>('normal');
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingThaiFoodPairings, setLoadingThaiFoodPairings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMockWineData = (): WineRating => {
    const mockWines: WineRating[] = [
      {
        wine_name: "Château Margaux 2015",
        rating: 98,
        vintage: 2015,
        producer: "Château Margaux",
        region: "Margaux, Bordeaux, France",
        tasting_notes: "An extraordinary wine with remarkable elegance and complexity. Dark fruit aromas of blackcurrant and blackberry are complemented by floral notes of violet and rose. The palate is full-bodied yet refined, with silky tannins, perfect balance, and a long, persistent finish. This vintage showcases the quintessential character of Margaux.",
        review_date: "2018-04-15",
        price: "$899",
        source_url: "https://www.jamessuckling.com/wines/chateau-margaux-2015/",
        found: true
      },
      {
        wine_name: "Opus One 2018",
        rating: 96,
        vintage: 2018,
        producer: "Opus One Winery",
        region: "Napa Valley, California",
        tasting_notes: "A powerful and sophisticated blend showing dark cherry, cassis, and chocolate notes. Full-bodied with firm tannins and excellent structure. Layers of complexity unfold with cedar, tobacco, and spice nuances. The finish is long and memorable with great aging potential.",
        review_date: "2021-09-22",
        price: "$485",
        source_url: "https://www.jamessuckling.com/wines/opus-one-2018/",
        found: true
      },
      {
        wine_name: "Roberto Voerzio Barolo Brunate 2017",
        rating: 97,
        vintage: 2017,
        producer: "Roberto Voerzio",
        region: "Piedmont, Italy",
        tasting_notes: "(Jame Suckling) Very subtle aromas of dried strawberry with cedar and flowers that follow through to a full body with tight, linear tannins that are focused and polished. Earth, spice and stone undertones. Extremely firm and long. Succulent. Racy and driven. Needs four or five years to open.",
        review_date: "2021-11-08",
        price: "$359",
        source_url: "https://www.wine.com/product/roberto-voerzio-barolo-brunate-2017/1221807",
        found: true,
        blend: [
          { grape: "Nebbiolo", percentage: 100 }
        ],
        reviews: [
          {
            critic: "James Suckling",
            publication: "JamesSuckling.com",
            rating: 97,
            maxRating: 100,
            review: "Very subtle aromas of dried strawberry with cedar and flowers that follow through to a full body with tight, linear tannins that are focused and polished. Earth, spice and stone undertones. Extremely firm and long. Succulent. Racy and driven. Needs four or five years to open.",
            reviewDate: "2021-11-08"
          },
          {
            critic: "Robert Parker",
            publication: "Wine Advocate",
            rating: 95,
            maxRating: 100,
            review: "The 2017 Barolo Brunate is absolutely gorgeous, with incredible elegance and finesse. Aromatics include dark cherry, rose petals, and subtle spice. On the palate, it's full-bodied yet graceful, with silky tannins and remarkable length.",
            reviewDate: "2021-10-15"
          }
        ],
        thaiFoodPairings: [
          {
            name: "Massaman Curry with Beef",
            nameInThai: "เนื้อมัสมั่น",
            description: "Beef slow-cooked with warm spices, peanuts, and coconut milk in a rich, aromatic curry.",
            spiceLevel: "mild" as const,
            pairingReason: "The richness and slight sweetness balance Barolo's tannins, while warm spices complement the wine's earthy notes."
          },
          {
            name: "Hung Lay Curry",
            nameInThai: "แกงฮังเล",
            description: "Northern Thai pork curry with ginger, tamarind, and garlic - earthy and deeply savory.",
            spiceLevel: "medium" as const,
            pairingReason: "The earthy, savory flavors match Nebbiolo's depth, while the richness balances the wine's structure."
          },
          {
            name: "Grilled Beef with Jeaw",
            nameInThai: "เนื้อย่างน้ำจิ้มแจ่ว",
            description: "Chargrilled beef served with a savory, less spicy northeastern Thai dipping sauce.",
            spiceLevel: "mild" as const,
            pairingReason: "Smoke and char echo Barolo's tarry notes, while the umami-rich sauce complements the wine's complexity."
          },
          {
            name: "Pad Kra Pao with Beef",
            nameInThai: "กะเพราเนื้อ",
            description: "Stir-fried beef with holy basil, made with moderate spice levels.",
            spiceLevel: "medium" as const,
            pairingReason: "Holy basil provides aromatic freshness against tannins, while beef's umami complements the wine's depth."
          }
        ]
      },
      {
        wine_name: "Dom Pérignon 2012",
        rating: 97,
        vintage: 2012,
        producer: "Dom Pérignon",
        region: "Champagne, France",
        tasting_notes: "Exceptional vintage Champagne with remarkable depth and complexity. Fine, persistent bubbles and a beautiful golden color. The nose reveals notes of white flowers, citrus, and subtle mineral undertones. On the palate, it's creamy and elegant with flavors of brioche, almonds, and white fruits. Perfect balance and a very long finish.",
        review_date: "2022-03-12",
        price: "$220",
        source_url: "https://www.jamessuckling.com/wines/dom-perignon-2012/",
        found: true
      },
      {
        wine_name: "Caymus Cabernet Sauvignon 2020",
        rating: 92,
        vintage: 2020,
        producer: "Caymus Vineyards",
        region: "Napa Valley, California",
        tasting_notes: "Rich and concentrated Napa Cabernet with ripe blackberry and cassis flavors. Full-bodied with smooth tannins and notes of vanilla, chocolate, and coffee from oak aging. Well-balanced with good acidity and a warm, lingering finish. Approachable now but will continue to develop.",
        review_date: "2023-01-20",
        price: "$89",
        source_url: "https://www.jamessuckling.com/wines/caymus-cabernet-2020/",
        found: true
      },
      {
        wine_name: "Unknown Wine Label",
        rating: undefined,
        vintage: undefined,
        producer: undefined,
        region: undefined,
        tasting_notes: undefined,
        review_date: undefined,
        price: undefined,
        source_url: undefined,
        found: false,
        error_message: "Unable to identify wine from the provided image. Please ensure the label is clearly visible and try again."
      }
    ];
    
    return mockWines[2]
    
    //return mockWines[Math.floor(Math.random() * mockWines.length)];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const fetchThaiFoodPairingsForWine = async (wineName: string) => {
    setLoadingThaiFoodPairings(true);
    try {
      console.log('🍜 Fetching Thai food pairings for:', wineName, 'with model:', selectedModel);
      const pairings = await wineService.fetchThaiFoodPairings(wineName, selectedModel);

      console.log('🍜 Thai food pairings received:', pairings);

      if (pairings && pairings.length > 0) {
        console.log('🍜 Setting Thai food pairings to result state');
        setResult(prevResult => {
          if (!prevResult) {
            console.warn('🍜 Previous result is null, cannot set pairings');
            return null;
          }
          const updatedResult = {
            ...prevResult,
            thaiFoodPairings: pairings
          };
          console.log('🍜 Updated result with Thai food pairings:', updatedResult);
          return updatedResult;
        });
      } else {
        console.warn('🍜 No Thai food pairings received from API');
      }
    } catch (error) {
      console.error('🍜 Error fetching Thai food pairings:', error);
    } finally {
      setLoadingThaiFoodPairings(false);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');
    setResult(null);
    setStreamingText('');
    setIsStreaming(false);

    try {
      if (useMockData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        const mockData = getMockWineData();
        setResult(mockData);

        // Fetch Thai food pairings from API
        if (mockData.found && mockData.wine_name) {
          await fetchThaiFoodPairingsForWine(mockData.wine_name);
        }

        // Enhance wine data with AI if enabled and wine was found
        if (useAIEnhancement && mockData.found) {
          await enhanceWineData(mockData);
        }
      } else {
        // Enable streaming mode
        setIsStreaming(true);

        // Use LangChain vision model with streaming callback
        const analysisResult = await wineService.analyzeWineImage(
          selectedFile,
          selectedModel,
          (text) => {
            // Update streaming text in real-time
            setStreamingText(text);
          }
        );

        // Streaming completed
        setIsStreaming(false);

        // Convert WineAnalysisResult to WineRating format
        const wineRating: WineRating = {
          wine_name: analysisResult.wine_name,
          rating: analysisResult.rating,
          vintage: analysisResult.vintage,
          producer: analysisResult.producer,
          region: analysisResult.region,
          tasting_notes: analysisResult.tasting_notes,
          review_date: analysisResult.review_date,
          price: analysisResult.price,
          source_url: analysisResult.source_url,
          found: analysisResult.found,
          error_message: analysisResult.error_message,
          // Add new API response fields
          blend: analysisResult.blend,
          reviews: analysisResult.reviews,
          grape_varieties: analysisResult.grape_varieties,
          scores: analysisResult.scores,
          pricing: analysisResult.pricing,
          full_reviews: analysisResult.full_reviews,
          references: analysisResult.references
        };

        setResult(wineRating);

        // Fetch Thai food pairings from API
        if (wineRating.found && wineRating.wine_name) {
          await fetchThaiFoodPairingsForWine(wineRating.wine_name);
        }

        // Enhance wine data with AI if enabled and wine was found
        if (useAIEnhancement && wineRating.found) {
          await enhanceWineData(wineRating);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan wine image');
    } finally {
      setLoading(false);
    }
  };

  const enhanceWineData = async (wineData: WineRating) => {
    if (!useAIEnhancement) return;
    
    // setEnhancing(true);
    // try {
    //   const enhanced = await wineService.enhanceWineData({
    //     wine_name: wineData.wine_name,
    //     rating: wineData.rating,
    //     vintage: wineData.vintage,
    //     producer: wineData.producer,
    //     region: wineData.region,
    //     tasting_notes: wineData.tasting_notes
    //   });
      
    //   setEnhancedResult(enhanced);
    // } catch (err) {
    //   console.error('Failed to enhance wine data:', err);
    // } finally {
    //   setEnhancing(false);
    // }
  };

  const handleWineSelect = async (wineData: any) => {
    // Convert wine search data to WineRating format
    const wineRating: WineRating = {
      wine_name: wineData.wine_name,
      rating: wineData.rating,
      vintage: wineData.vintage,
      producer: wineData.producer,
      region: wineData.region,
      tasting_notes: wineData.tasting_notes,
      found: true
    };

    setResult(wineRating);
    setShowWineSearch(false);

    // Fetch Thai food pairings from API
    if (wineRating.wine_name) {
      await fetchThaiFoodPairingsForWine(wineRating.wine_name);
    }

    // Enhance wine data with AI if enabled
    if (useAIEnhancement) {
      await enhanceWineData(wineRating);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setEnhancedResult(null);
    setError('');
    setShowWineSearch(false);
    setStreamingText('');
    setIsStreaming(false);
    setLoadingThaiFoodPairings(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="wine-scanner">
      <div className="scanner-header">
        <h1>Wine Miss You Testing AI</h1>
        <p>Upload a wine bottle image or search our wine database</p>
        <div className="main-actions">
          <button 
            onClick={() => setShowWineSearch(!showWineSearch)}
            className="wine-search-toggle"
          >
            {showWineSearch ? '📷 Image Scan' : '🔍 Search Wines'}
          </button>
        </div>
        <div className="mode-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={useMockData}
              onChange={(e) => setUseMockData(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-text">
              {useMockData ? '🧪 Demo Mode' : '🔗 Live API'}
            </span>
          </label>

          <label className="toggle-label">
            <input
              type="checkbox"
              checked={useAIEnhancement}
              onChange={(e) => setUseAIEnhancement(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-text">
              {useAIEnhancement ? '🤖 AI Enhancement' : '📊 Basic Data'}
            </span>
          </label>

          <div className="model-selector">
            <button
              className={`model-button ${selectedModel === 'normal' ? 'active' : ''}`}
              onClick={() => setSelectedModel('normal')}
              disabled={useMockData}
            >
              ⚡ Normal
            </button>
            <button
              className={`model-button ${selectedModel === 'advance' ? 'active' : ''}`}
              onClick={() => setSelectedModel('advance')}
              disabled={useMockData}
            >
              🚀 Advance
            </button>
          </div>
        </div>
      </div>

      {showWineSearch ? (
        <WineSearch onWineSelect={handleWineSelect} />
      ) : (
        <>
          <div className="upload-section">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="file-input"
        />
        
        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
          {previewUrl ? (
            <img src={previewUrl} alt="Wine bottle preview" className="preview-image" />
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">📷</div>
              <p>Click to select wine image</p>
              <p className="upload-hint">Supports JPG, PNG, WebP</p>
            </div>
          )}
        </div>
      </div>

      <div className="action-buttons">
        <button
          onClick={handleScan}
          disabled={!selectedFile || loading || enhancing}
          className="scan-button"
        >
          {loading ? 'Scanning...' : enhancing ? 'Enhancing...' : 'Scan Wine'}
        </button>
        
        <button
          onClick={handleClear}
          disabled={loading || enhancing}
          className="clear-button"
        >
          Clear
        </button>
        
        {result && result.found && !enhancing && (
          <button
            onClick={() => enhanceWineData(result)}
            disabled={loading}
            className="enhance-button"
          >
            🤖 Enhance with AI
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {isStreaming && streamingText && (
        <div className="streaming-section">
          <div className="streaming-header">
            <h3>🔄 Analyzing Wine...</h3>
            <div className="streaming-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
          <div className="streaming-content">
            <pre>{streamingText}</pre>
          </div>
        </div>
      )}

      {result && (
        <div className="result-section">
          {result.found ? (
            <div className="wine-details">
              <div className="wine-header">
                <h2>{result.wine_name}</h2>
                {result.rating && (
                  <div className="wine-rating">
                    <span className="rating-score">{result.rating}</span>
                    <span className="rating-max">/100</span>
                  </div>
                )}
              </div>

              <div className="wine-info-grid">
                {result.vintage && (
                  <div className="info-item">
                    <span className="info-label">Vintage</span>
                    <span className="info-value">{result.vintage}</span>
                  </div>
                )}

                {result.producer && (
                  <div className="info-item">
                    <span className="info-label">Producer</span>
                    <span className="info-value">{result.producer}</span>
                  </div>
                )}

                {result.region && (
                  <div className="info-item">
                    <span className="info-label">Region</span>
                    <span className="info-value">{result.region}</span>
                  </div>
                )}

                {(result.price || result.pricing) && (
                  <div className="info-item">
                    <span className="info-label">Price</span>
                    <span className="info-value">{result.pricing || result.price}</span>
                  </div>
                )}

                {result.scores && (
                  <div className="info-item">
                    <span className="info-label">Score</span>
                    <span className="info-value">{result.scores}</span>
                  </div>
                )}

                {result.review_date && (
                  <div className="info-item">
                    <span className="info-label">Review Date</span>
                    <span className="info-value">{result.review_date}</span>
                  </div>
                )}
              </div>

              {result.grape_varieties && result.grape_varieties.length > 0 && (
                <div className="grape-varieties">
                  <h3>🍇 Grape Varieties</h3>
                  <div className="grape-list">
                    {result.grape_varieties.map((grape, index) => (
                      <span key={index} className="grape-badge">{grape}</span>
                    ))}
                  </div>
                </div>
              )}

              {(enhancedResult?.enhanced_tasting_notes || result.tasting_notes) && (
                <div className="tasting-notes">
                  <h3>Tasting Notes {enhancedResult?.enhanced_tasting_notes && '🤖'}</h3>
                  <p>{enhancedResult?.enhanced_tasting_notes || result.tasting_notes}</p>
                </div>
              )}
              
              {enhancedResult && (
                <div className="enhanced-wine-details">
                  {enhancedResult.wine_style && (
                    <div className="wine-info-grid">
                      <div className="info-item">
                        <span className="info-label">Wine Style</span>
                        <span className="info-value">{enhancedResult.wine_style}</span>
                      </div>
                      {enhancedResult.aging_potential && (
                        <div className="info-item">
                          <span className="info-label">Aging Potential</span>
                          <span className="info-value">{enhancedResult.aging_potential}</span>
                        </div>
                      )}
                      {enhancedResult.serving_temp && (
                        <div className="info-item">
                          <span className="info-label">Serving Temperature</span>
                          <span className="info-value">{enhancedResult.serving_temp}</span>
                        </div>
                      )}
                      {enhancedResult.decanting_time && (
                        <div className="info-item">
                          <span className="info-label">Decanting Time</span>
                          <span className="info-value">{enhancedResult.decanting_time}</span>
                        </div>
                      )}
                      {enhancedResult.price_range && (
                        <div className="info-item">
                          <span className="info-label">Typical Price Range</span>
                          <span className="info-value">{enhancedResult.price_range}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {enhancedResult.food_pairings && (
                    <div className="food-pairings">
                      <h3>🍽️ Classic Food Pairings</h3>
                      <ul>
                        {enhancedResult.food_pairings.map((pairing, index) => (
                          <li key={index}>{pairing}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* {enhancedResult.similar_wines && (
                    <div className="similar-wines">
                      <h3>🍷 Similar Wines to Try</h3>
                      <ul>
                        {enhancedResult.similar_wines.map((wine, index) => (
                          <li key={index}>{wine}</li>
                        ))}
                      </ul>
                    </div>
                  )} */}
                  
                  {enhancedResult.collector_notes && (
                    <div className="collector-notes">
                      <h3>💎 Collector Notes</h3>
                      <p>{enhancedResult.collector_notes}</p>
                    </div>
                  )}
                </div>
              )}
              {result.blend && <WineBlend blends={result.blend} />}
              
              {result.reviews && (
                <>
                  <WineReviews reviews={result.reviews} />
                  <ReviewSentimentAnalysis reviews={result.reviews} />
                </>
              )}

              {loadingThaiFoodPairings && (
                <div className="thai-food-loading">
                  <div className="loading-header">
                    <h3>🍜 Loading Thai Food Pairings...</h3>
                    <div className="streaming-indicator">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                  <p>Finding the perfect Thai dishes to pair with your wine...</p>
                </div>
              )}

              {!loadingThaiFoodPairings && (enhancedResult?.thai_food_pairings || result.thaiFoodPairings) && (
                <ThaiFoodPairing
                  pairings={(enhancedResult?.thai_food_pairings || result.thaiFoodPairings)!}
                  wineStyle={enhancedResult?.wine_style || "Barolo/Nebbiolo"}
                />
              )}
              
              {/* <WineRecommendations 
                wineData={{
                  wine_name: result.wine_name,
                  rating: result.rating,
                  vintage: result.vintage,
                  producer: result.producer,
                  region: result.region,
                  tasting_notes: result.tasting_notes
                }}
              />
              
              <WineChatAssistant 
                wineData={{
                  wine_name: result.wine_name,
                  rating: result.rating,
                  vintage: result.vintage,
                  producer: result.producer,
                  region: result.region,
                  tasting_notes: result.tasting_notes
                }}
              /> */}

              {(result.source_url || result.references) && (
                <div className="source-link">
                  <a
                    href={
                      (result.source_url || result.references)?.startsWith('http')
                        ? (result.source_url || result.references)
                        : `https://${result.source_url || result.references}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Full Review
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="wine-not-found">
              <h2>Wine Not Found</h2>
              <p>Sorry, we couldn't identify this wine in our database.</p>
              {result.error_message && (
                <p className="error-details">{result.error_message}</p>
              )}
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default WineScanner;
