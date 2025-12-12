import React, { useState } from 'react';
import { wineService } from '../services/langchainService';
import './ReviewSentimentAnalysis.css';

interface CriticReview {
  critic: string;
  publication?: string;
  rating: number;
  maxRating?: number;
  review: string;
  reviewDate?: string;
}

interface SentimentData {
  overall: string;
  individual: Array<{
    review: string;
    sentiment: string;
    score: number;
  }>;
}

interface ReviewSentimentAnalysisProps {
  reviews: CriticReview[];
}

const ReviewSentimentAnalysis: React.FC<ReviewSentimentAnalysisProps> = ({ reviews }) => {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const analyzeSentiment = async () => {
    setLoading(true);
    
    // try {
    //   const reviewTexts = reviews.map(r => r.review);
    //   const analysis = await wineService.analyzeSentiment(reviewTexts);
    //   setSentimentData(analysis);
    //   setShowAnalysis(true);
    // } catch (error) {
    //   console.error('Sentiment analysis failed:', error);
    // } finally {
    //   setLoading(false);
    // }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return '#28a745';
      case 'negative': return '#dc3545';
      case 'neutral': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '🤔';
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.7) return 'Strong';
    if (score >= 0.5) return 'Moderate';
    return 'Weak';
  };

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <div className="review-sentiment-analysis">
      <div className="sentiment-header">
        <h3>🧠 AI Sentiment Analysis</h3>
        {!showAnalysis && (
          <button 
            onClick={analyzeSentiment}
            disabled={loading}
            className="analyze-button"
          >
            {loading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>
        )}
      </div>

      {showAnalysis && sentimentData && (
        <div className="sentiment-results">
          <div className="overall-sentiment">
            <div className="sentiment-card">
              <div className="sentiment-label">Overall Sentiment</div>
              <div 
                className="sentiment-value"
                style={{ color: getSentimentColor(sentimentData.overall) }}
              >
                {getSentimentEmoji(sentimentData.overall)} {sentimentData.overall.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="individual-sentiments">
            <h4>Individual Review Analysis</h4>
            {sentimentData.individual.map((item, index) => (
              <div key={index} className="review-sentiment-item">
                <div className="review-header">
                  <span className="review-critic">{reviews[index]?.critic || 'Anonymous'}</span>
                  <div className="sentiment-badge">
                    <span 
                      className="sentiment-indicator"
                      style={{ color: getSentimentColor(item.sentiment) }}
                    >
                      {getSentimentEmoji(item.sentiment)} {item.sentiment}
                    </span>
                    <span className="sentiment-score">
                      {getScoreLabel(item.score)} ({Math.round(item.score * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="review-excerpt">
                  {item.review.length > 150 ? `${item.review.substring(0, 150)}...` : item.review}
                </div>
              </div>
            ))}
          </div>

          <div className="sentiment-summary">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Positive Reviews</span>
                <span className="stat-value positive">
                  {sentimentData.individual.filter(s => s.sentiment === 'positive').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Neutral Reviews</span>
                <span className="stat-value neutral">
                  {sentimentData.individual.filter(s => s.sentiment === 'neutral').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Negative Reviews</span>
                <span className="stat-value negative">
                  {sentimentData.individual.filter(s => s.sentiment === 'negative').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSentimentAnalysis;