import React, { useState } from 'react';
import { apiService, type InsightsResponse } from '../services/api';

interface InsightsDisplayProps {
  userId: string;
  onClose: () => void;
}

const InsightsDisplay: React.FC<InsightsDisplayProps> = ({ userId, onClose }) => {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [days, setDays] = useState(1);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getInsights(userId, days, includeRecommendations);
      setInsights(response);
    } catch (err) {
      setError('Failed to fetch insights. Please try again.');
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="insights-overlay">
      <div className="insights-modal">
        <div className="insights-header">
          <h2>🤖 AI Health Insights</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="insights-controls">
          <div className="control-group">
            <label>Analysis Period:</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={1}>Last 1 day</option>
              <option value={3}>Last 3 days</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>
              <input 
                type="checkbox" 
                checked={includeRecommendations} 
                onChange={(e) => setIncludeRecommendations(e.target.checked)}
              />
              Include Dinner Recommendations
            </label>
          </div>
          
          <button 
            className="fetch-btn" 
            onClick={fetchInsights} 
            disabled={loading}
          >
            {loading ? '🔄 Analyzing...' : '🚀 Get Insights'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {insights && (
          <div className="insights-content">
            {/* Summary Section */}
            <div className="insight-section">
              <h3>📊 Daily Summary</h3>
              <p className="summary-text">{insights.data.summary}</p>
            </div>

            {/* Motivation Section */}
            <div className="insight-section">
              <h3>💪 Motivation</h3>
              <p className="motivation-text">{insights.data.motivation}</p>
            </div>

            {/* Key Insights */}
            <div className="insight-section">
              <h3>🔍 Key Insights</h3>
              <ul className="insights-list">
                {insights.data.keyInsights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>

            {/* Progress Summary */}
            <div className="insight-section">
              <h3>📈 Progress Summary</h3>
              <p className="progress-text">{insights.data.progressSummary}</p>
            </div>

            {/* Suggestions */}
            <div className="insight-section">
              <h3>💡 Suggestions</h3>
              <ul className="suggestions-list">
                {insights.data.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="insight-section">
              <h3>🎯 Next Steps</h3>
              <ul className="next-steps-list">
                {insights.data.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>

            {/* Dinner Recommendation */}
            {includeRecommendations && insights.data.dinnerRecommendation && (
              <div className="insight-section dinner-section">
                <h3>🍽️ Dinner Recommendation</h3>
                <div className="dinner-recommendation">
                  <p>{insights.data.dinnerRecommendation}</p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="insights-metadata">
              <h4>📋 Analysis Details</h4>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <strong>Generated:</strong> {formatTime(insights.metadata.generatedAt)}
                </div>
                <div className="metadata-item">
                  <strong>Timeframe:</strong> {insights.metadata.analysisTimeframe}
                </div>
                <div className="metadata-item">
                  <strong>Data Points:</strong> {insights.metadata.dataPoints.totalLogs} logs
                </div>
                <div className="metadata-item">
                  <strong>Past Interactions:</strong> {insights.metadata.userContext.totalInteractions}
                </div>
              </div>
              
              {insights.metadata.foodContext && (
                <div className="food-context">
                  <h5>🍎 Food Analysis</h5>
                  <div className="macro-analysis">
                    <span className={`macro-item ${insights.metadata.foodContext.macroAnalysis.needsProtein ? 'needs' : 'sufficient'}`}>
                      Protein: {insights.metadata.foodContext.macroAnalysis.needsProtein ? 'Needs More' : 'Sufficient'}
                    </span>
                    <span className={`macro-item ${insights.metadata.foodContext.macroAnalysis.needsCarbs ? 'needs' : 'sufficient'}`}>
                      Carbs: {insights.metadata.foodContext.macroAnalysis.needsCarbs ? 'Needs More' : 'Sufficient'}
                    </span>
                    <span className={`macro-item ${insights.metadata.foodContext.macroAnalysis.needsFats ? 'needs' : 'sufficient'}`}>
                      Fats: {insights.metadata.foodContext.macroAnalysis.needsFats ? 'Needs More' : 'Sufficient'}
                    </span>
                    <span className={`macro-item ${insights.metadata.foodContext.macroAnalysis.needsVegetables ? 'needs' : 'sufficient'}`}>
                      Vegetables: {insights.metadata.foodContext.macroAnalysis.needsVegetables ? 'Needs More' : 'Sufficient'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsDisplay;
