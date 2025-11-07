import React from 'react';
import './ThaiFoodPairing.css';

interface PairingDish {
  name: string;
  nameInThai: string;
  description: string;
  spiceLevel: 'mild' | 'medium' | 'hot';
  pairingReason: string;
}

interface ThaiFoodPairingProps {
  pairings: PairingDish[];
  wineStyle?: string;
}

const ThaiFoodPairing: React.FC<ThaiFoodPairingProps> = ({ pairings, wineStyle }) => {
  if (!pairings || pairings.length === 0) {
    return null;
  }

  const getSpiceLevelColor = (level: string) => {
    switch (level) {
      case 'mild': return '#28a745';
      case 'medium': return '#ffc107';
      case 'hot': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getSpiceLevelIcon = (level: string) => {
    switch (level) {
      case 'mild': return '🌿';
      case 'medium': return '🌶️';
      case 'hot': return '🔥';
      default: return '';
    }
  };

  return (
    <div className="thai-food-pairing">
      <div className="pairing-header">
        <h3>Thai Food Pairing</h3>
        {wineStyle && (
          <p className="wine-style-note">
            Perfect matches for {wineStyle} wines
          </p>
        )}
      </div>
      
      <div className="pairing-intro">
        <p>
          Thai cuisine requires careful wine pairing due to complex spice profiles. 
          These dishes complement the wine's characteristics while balancing heat and tannins.
        </p>
      </div>

      <div className="pairings-grid">
        {pairings.map((pairing, index) => (
          <div key={index} className="pairing-card">
            <div className="dish-header">
              <div className="dish-names">
                <h4 className="dish-name">{pairing.name}</h4>
                <span className="thai-name">{pairing.nameInThai}</span>
              </div>
              <div 
                className="spice-indicator"
                style={{ backgroundColor: getSpiceLevelColor(pairing.spiceLevel) }}
              >
                <span className="spice-icon">{getSpiceLevelIcon(pairing.spiceLevel)}</span>
                <span className="spice-text">{pairing.spiceLevel}</span>
              </div>
            </div>
            
            <div className="dish-description">
              <p>{pairing.description}</p>
            </div>
            
            <div className="pairing-reason">
              <div className="reason-header">
                <span className="reason-icon">🍷</span>
                <span className="reason-title">Why it works</span>
              </div>
              <p>{pairing.pairingReason}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pairing-tips">
        <h4>Pairing Tips</h4>
        <ul>
          <li>Choose milder spice levels to avoid overwhelming tannins</li>
          <li>Look for dishes with coconut milk to complement wine richness</li>
          <li>Grilled meats pair excellently with bold red wines</li>
          <li>Fresh herbs like basil and mint provide aromatic balance</li>
        </ul>
      </div>
    </div>
  );
};

export default ThaiFoodPairing;