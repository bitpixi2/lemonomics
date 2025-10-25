import React from 'react';

interface MarketNews {
  headline: string;
  story: string;
  impact: string;
  timestamp: string;
}

interface CustomerDialogue {
  customerType: string;
  greeting: string;
  reaction: string;
  comment: string;
  mood: 'happy' | 'neutral' | 'disappointed' | 'excited';
}

interface AIContentDisplayProps {
  marketNews?: MarketNews;
  customerDialogue?: CustomerDialogue;
  aiEnabled?: boolean;
}

export const AIContentDisplay: React.FC<AIContentDisplayProps> = ({
  marketNews,
  customerDialogue,
  aiEnabled = false
}) => {
  if (!marketNews && !customerDialogue) {
    return null;
  }

  const getMoodEmoji = (mood: CustomerDialogue['mood']) => {
    switch (mood) {
      case 'excited': return '🤩';
      case 'happy': return '😊';
      case 'neutral': return '😐';
      case 'disappointed': return '😕';
      default: return '😊';
    }
  };

  const getMoodColor = (mood: CustomerDialogue['mood']) => {
    switch (mood) {
      case 'excited': return '#ff6b35';
      case 'happy': return '#4caf50';
      case 'neutral': return '#757575';
      case 'disappointed': return '#f44336';
      default: return '#4caf50';
    }
  };

  return (
    <div className="ai-content-container">
      {/* AI Status Indicator */}
      <div className="ai-status">
        <span className={`ai-indicator ${aiEnabled ? 'enabled' : 'fallback'}`}>
          {aiEnabled ? '🤖 AI Enhanced' : '📝 Classic Mode'}
        </span>
      </div>

      {/* Market News Section */}
      {marketNews && (
        <div className="market-news-section">
          <div className="section-header">
            <h3>📰 Daily Market Report</h3>
          </div>
          <div className="news-card">
            <h4 className="news-headline">{marketNews.headline}</h4>
            <p className="news-story">{marketNews.story}</p>
            <div className="news-impact">
              <strong>Business Impact:</strong> {marketNews.impact}
            </div>
          </div>
        </div>
      )}

      {/* Customer Dialogue Section */}
      {customerDialogue && (
        <div className="customer-dialogue-section">
          <div className="section-header">
            <h3>💬 Customer Interaction</h3>
          </div>
          <div className="dialogue-card">
            <div className="customer-info">
              <span className="customer-type">{customerDialogue.customerType}</span>
              <span 
                className="mood-indicator"
                style={{ color: getMoodColor(customerDialogue.mood) }}
              >
                {getMoodEmoji(customerDialogue.mood)}
              </span>
            </div>
            <div className="dialogue-sequence">
              <div className="dialogue-line greeting">
                <span className="speaker">Customer:</span>
                <span className="text">"{customerDialogue.greeting}"</span>
              </div>
              <div className="dialogue-line reaction">
                <span className="speaker">Customer:</span>
                <span className="text">"{customerDialogue.reaction}"</span>
              </div>
              <div className="dialogue-line comment">
                <span className="speaker">Customer:</span>
                <span className="text">"{customerDialogue.comment}"</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
