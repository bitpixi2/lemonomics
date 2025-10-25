import React, { useState } from 'react';
import { Leaderboard } from '../../shared/types/game.js';

interface LeaderboardDisplayProps {
  dailyLeaderboard?: Leaderboard;
  weeklyLeaderboard?: Leaderboard;
  userRank?: {
    daily: number;
    weekly: number;
    dailyPure: number;
    weeklyPure: number;
  };
}

export const LeaderboardDisplay = ({
  dailyLeaderboard,
  weeklyLeaderboard,
  userRank
}: LeaderboardDisplayProps) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [showPure, setShowPure] = useState(false);

  const currentLeaderboard = activeTab === 'daily' ? dailyLeaderboard : weeklyLeaderboard;
  const entries = showPure ? currentLeaderboard?.pure : currentLeaderboard?.entries;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getUserCurrentRank = () => {
    if (!userRank) return null;
    
    if (activeTab === 'daily') {
      return showPure ? userRank.dailyPure : userRank.daily;
    } else {
      return showPure ? userRank.weeklyPure : userRank.weekly;
    }
  };

  return (
    <div className="leaderboard-display">
      <div className="leaderboard-header">
        <h3>🏆 Leaderboards</h3>
        
        {/* Tab Selector */}
        <div className="tab-selector">
          <button
            className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            📅 Daily
          </button>
          <button
            className={`tab ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            📊 Weekly
          </button>
        </div>

        {/* Pure League Toggle */}
        <div className="pure-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showPure}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowPure(e.target.checked)}
            />
            <span className="toggle-text">
              {showPure ? '⚡ Pure League' : '💫 All Players'}
            </span>
          </label>
        </div>
      </div>

      {/* User's Current Rank */}
      {userRank && (
        <div className="user-rank">
          <div className="rank-info">
            Your Rank: <strong>{getRankEmoji(getUserCurrentRank() || 0)}</strong>
            {showPure && <span className="pure-badge">Pure</span>}
          </div>
        </div>
      )}

      {/* Leaderboard Entries */}
      <div className="leaderboard-entries">
        {entries && entries.length > 0 ? (
          entries.slice(0, 10).map((entry: any) => (
            <div key={entry.userId} className="leaderboard-entry">
              <div className="rank">
                {getRankEmoji(entry.rank)}
              </div>
              
              <div className="player-info">
                <div className="username">{entry.username}</div>
                <div className="score">{formatCurrency(entry.score)}</div>
              </div>
              
              <div className="entry-badges">
                {entry.powerupUsed && !showPure && (
                  <span className="powerup-badge" title="Used power-ups">
                    ⚡
                  </span>
                )}
                <span className="timestamp">
                  {formatTimeAgo(entry.timestamp)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-leaderboard">
            <div className="empty-icon">🍋</div>
            <div className="empty-text">
              No entries yet today. Be the first!
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Footer */}
      <div className="leaderboard-footer">
        <div className="reset-info">
          {activeTab === 'daily' ? (
            <span>🔄 Resets daily at midnight UTC</span>
          ) : (
            <span>🔄 Resets weekly on Sunday</span>
          )}
        </div>
        
        {showPure && (
          <div className="pure-info">
            <span>⚡ Pure League: No power-ups used</span>
          </div>
        )}
      </div>
    </div>
  );
};

const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  
  return timestamp.toLocaleDateString();
};
