import React from 'react';
import './WineReviews.css';

interface CriticReview {
  critic: string;
  publication?: string;
  rating: number;
  maxRating?: number;
  review: string;
  reviewDate?: string;
}

interface WineReviewsProps {
  reviews: CriticReview[];
}

const WineReviews: React.FC<WineReviewsProps> = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  const getRatingColor = (rating: number, maxRating: number = 100) => {
    const percentage = (rating / maxRating) * 100;
    if (percentage >= 95) return '#d4af37'; // Gold
    if (percentage >= 90) return '#27ae60'; // Green
    if (percentage >= 85) return '#f39c12'; // Orange
    return '#e74c3c'; // Red
  };

  return (
    <div className="wine-reviews">
      <h3>Critics' Reviews</h3>
      <div className="reviews-container">
        {reviews.map((review, index) => (
          <div key={index} className="review-card">
            <div className="review-header">
              <div className="critic-info">
                <h4 className="critic-name">{review.critic}</h4>
                {review.publication && (
                  <span className="publication">{review.publication}</span>
                )}
              </div>
              <div 
                className="rating-badge"
                style={{ backgroundColor: getRatingColor(review.rating, review.maxRating) }}
              >
                {review.rating}{review.maxRating && `/${review.maxRating}`}
              </div>
            </div>
            <div className="review-content">
              <p>"{review.review}"</p>
            </div>
            {review.reviewDate && (
              <div className="review-date">
                {new Date(review.reviewDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WineReviews;