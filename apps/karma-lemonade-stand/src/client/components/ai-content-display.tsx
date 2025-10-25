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

      <style jsx>{`
        .ai-content-container {
          margin: 20px 0;
          padding: 15px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          border: 1px solid #dee2e6;
        }

        .ai-status {
          text-align: center;
          margin-bottom: 15px;
        }

        .ai-indicator {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: bold;
        }

        .ai-indicator.enabled {
          background: linear-gradient(45deg, #4caf50, #8bc34a);
          color: white;
        }

        .ai-indicator.fallback {
          background: linear-gradient(45deg, #ff9800, #ffc107);
          color: white;
        }

        .section-header {
          margin-bottom: 10px;
        }

        .section-header h3 {
          margin: 0;
          color: #495057;
          font-size: 1.1em;
        }

        .news-card, .dialogue-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 15px;
        }

        .news-headline {
          margin: 0 0 10px 0;
          color: #212529;
          font-size: 1em;
          line-height: 1.3;
        }

        .news-story {
          margin: 0 0 10px 0;
          color: #6c757d;
          font-size: 0.9em;
          line-height: 1.4;
        }

        .news-impact {
          color: #495057;
          font-size: 0.85em;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
          border-left: 3px solid #007bff;
        }

        .customer-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }

        .customer-type {
          font-weight: bold;
          color: #495057;
        }

        .mood-indicator {
          font-size: 1.2em;
        }

        .dialogue-sequence {
          space-y: 8px;
        }

        .dialogue-line {
          margin-bottom: 8px;
          padding: 6px 0;
        }

        .speaker {
          font-weight: bold;
          color: #6c757d;
          font-size: 0.85em;
          margin-right: 8px;
        }

        .text {
          color: #495057;
          font-style: italic;
          font-size: 0.9em;
        }

        .greeting .text {
          color: #28a745;
        }

        .reaction .text {
          color: #007bff;
        }

        .comment .text {
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .ai-content-container {
            margin: 15px 0;
            padding: 12px;
          }

          .news-card, .dialogue-card {
            padding: 12px;
          }

          .section-header h3 {
            font-size: 1em;
          }
        }
      `}</style>
    </div>
  );
};
