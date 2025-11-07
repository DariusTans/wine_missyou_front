import React from 'react';
import './WineBlend.css';

interface BlendVariety {
  grape: string;
  percentage: number;
}

interface WineBlendProps {
  blends: BlendVariety[];
}

const WineBlend: React.FC<WineBlendProps> = ({ blends }) => {
  if (!blends || blends.length === 0) {
    return null;
  }

  return (
    <div className="wine-blend">
      <h3>Grape Blend</h3>
      <div className="blend-container">
        {blends.map((blend, index) => (
          <div key={index} className="blend-item">
            <div className="blend-header">
              <span className="grape-name">{blend.grape}</span>
              <span className="grape-percentage">{blend.percentage}%</span>
            </div>
            <div className="blend-bar">
              <div 
                className="blend-fill" 
                style={{ width: `${blend.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WineBlend;