import React, { useState } from 'react';
import './WineScoreDisplay.css';

interface WineScoreDisplayProps {
  wineMissYouScore?: number;
  scores?: {
    james_suckling?: number;
    robert_parker?: number;
    vivno?: number;
  };
}

const WineScoreDisplay: React.FC<WineScoreDisplayProps> = ({ wineMissYouScore, scores }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!wineMissYouScore && !scores) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 95) return '#2ecc71'; // Excellent - Green
    if (score >= 90) return '#3498db'; // Outstanding - Blue
    if (score >= 85) return '#f39c12'; // Very Good - Orange
    if (score >= 80) return '#e67e22'; // Good - Dark Orange
    return '#95a5a6'; // Average - Gray
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 95) return 'Excellent';
    if (score >= 90) return 'Outstanding';
    if (score >= 85) return 'Very Good';
    if (score >= 80) return 'Good';
    return 'Average';
  };

  return (
    <div className="wine-score-display">
      <div
        className="wine-miss-you-score"
        onClick={toggleExpanded}
        style={{
          borderColor: wineMissYouScore ? getScoreColor(wineMissYouScore) : '#95a5a6'
        }}
      >
        <div className="score-main">
          <div className="score-label">WineMissYou Score</div>
          <div
            className="score-value"
            style={{ color: wineMissYouScore ? getScoreColor(wineMissYouScore) : '#95a5a6' }}
          >
            {wineMissYouScore || 'N/A'}
          </div>
          <div className="score-max">/100</div>
          {wineMissYouScore && (
            <div
              className="score-rating"
              style={{ color: getScoreColor(wineMissYouScore) }}
            >
              {getScoreLabel(wineMissYouScore)}
            </div>
          )}
        </div>
        {scores && (
          <div className="expand-indicator">
            <span className={`arrow ${isExpanded ? 'up' : 'down'}`}>▼</span>
            <span className="expand-text">
              {isExpanded ? 'Hide Details' : 'View Details'}
            </span>
          </div>
        )}
      </div>

      {isExpanded && scores && (
        <div className="score-details">
          <div className="score-details-header">
            <h4>Detailed Scores</h4>
          </div>
          <div className="individual-scores">
            {scores.james_suckling !== undefined && (
              <div className="score-item">
                <div className="score-item-header">
                  <span className="critic-name">James Suckling</span>
                  <span className="score-weight">45% weight</span>
                </div>
                <div className="score-bar-container">
                  <div
                    className="score-bar"
                    style={{
                      width: `${scores.james_suckling}%`,
                      backgroundColor: getScoreColor(scores.james_suckling)
                    }}
                  />
                  <span className="score-number">{scores.james_suckling}/100</span>
                </div>
              </div>
            )}

            {scores.robert_parker !== undefined && (
              <div className="score-item">
                <div className="score-item-header">
                  <span className="critic-name">Robert Parker</span>
                  <span className="score-weight">45% weight</span>
                </div>
                <div className="score-bar-container">
                  <div
                    className="score-bar"
                    style={{
                      width: `${scores.robert_parker}%`,
                      backgroundColor: getScoreColor(scores.robert_parker)
                    }}
                  />
                  <span className="score-number">{scores.robert_parker}/100</span>
                </div>
              </div>
            )}

            {scores.vivno !== undefined && (
              <div className="score-item">
                <div className="score-item-header">
                  <span className="critic-name">Vivino</span>
                  <span className="score-weight">10% weight</span>
                </div>
                <div className="score-bar-container">
                  <div
                    className="score-bar"
                    style={{
                      width: `${(scores.vivno / 5) * 100}%`,
                      backgroundColor: getScoreColor((scores.vivno / 5) * 100)
                    }}
                  />
                  <span className="score-number">{scores.vivno}/5.0</span>
                </div>
              </div>
            )}
          </div>
          <div className="score-formula">
            <p>
              <strong>Calculation:</strong> WineMissYou Score =
              ((James/20 × 0.45) + (Robert/20 × 0.45) + (Vivino × 0.1)) × 20
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WineScoreDisplay;
