const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class VectorDatabase {
  constructor() {
    this.vectors = new Map(); // Store vectors in memory
    this.documents = new Map(); // Store document metadata
    this.dataDir = path.join(__dirname, '../data/vector_db');
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Create vector database directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Load existing vectors from files
      await this.loadVectors();
      
      this.isInitialized = true;
      console.log('Vector database initialized successfully');
      console.log(`Loaded ${this.vectors.size} vectors and ${this.documents.size} documents`);
    } catch (error) {
      console.error('Failed to initialize vector database:', error);
      this.isInitialized = true;
    }
  }

  async loadVectors() {
    try {
      const vectorsFile = path.join(this.dataDir, 'vectors.json');
      const documentsFile = path.join(this.dataDir, 'documents.json');
      
      // Load vectors
      try {
        const vectorsData = await fs.readFile(vectorsFile, 'utf8');
        const vectors = JSON.parse(vectorsData);
        for (const [id, vector] of Object.entries(vectors)) {
          this.vectors.set(id, vector);
        }
      } catch (error) {
        console.log('No existing vectors file found, starting fresh');
      }
      
      // Load documents
      try {
        const documentsData = await fs.readFile(documentsFile, 'utf8');
        const documents = JSON.parse(documentsData);
        for (const [id, doc] of Object.entries(documents)) {
          this.documents.set(id, doc);
        }
      } catch (error) {
        console.log('No existing documents file found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading vectors:', error);
    }
  }

  async saveVectors() {
    try {
      const vectorsFile = path.join(this.dataDir, 'vectors.json');
      const documentsFile = path.join(this.dataDir, 'documents.json');
      
      // Save vectors
      const vectorsObj = {};
      for (const [id, vector] of this.vectors) {
        vectorsObj[id] = vector;
      }
      await fs.writeFile(vectorsFile, JSON.stringify(vectorsObj, null, 2));
      
      // Save documents
      const documentsObj = {};
      for (const [id, doc] of this.documents) {
        documentsObj[id] = doc;
      }
      await fs.writeFile(documentsFile, JSON.stringify(documentsObj, null, 2));
      
      console.log(`Saved ${this.vectors.size} vectors and ${this.documents.size} documents`);
    } catch (error) {
      console.error('Error saving vectors:', error);
    }
  }

  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async addDocument(id, content, metadata = {}) {
    await this.initialize();
    
    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(content);
      
      // Store vector and document
      this.vectors.set(id, embedding);
      this.documents.set(id, {
        id,
        content,
        metadata,
        timestamp: new Date().toISOString()
      });
      
      // Save to disk
      await this.saveVectors();
      
      console.log(`Added document ${id} to vector database`);
      return { id, embedding: embedding.length };
    } catch (error) {
      console.error('Error adding document to vector database:', error);
      throw error;
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async searchSimilar(query, options = {}) {
    await this.initialize();
    
    const {
      limit = 10,
      threshold = 0.7,
      where = {},
      excludeIds = []
    } = options;
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      const results = [];
      
      // Calculate similarity with all stored vectors
      for (const [id, vector] of this.vectors) {
        // Skip excluded IDs
        if (excludeIds.includes(id)) continue;
        
        const document = this.documents.get(id);
        if (!document) continue;
        
        // Apply where filters
        let matchesFilter = true;
        for (const [key, value] of Object.entries(where)) {
          if (document.metadata[key] !== value) {
            matchesFilter = false;
            break;
          }
        }
        
        if (!matchesFilter) continue;
        
        // Calculate similarity
        const similarity = this.cosineSimilarity(queryEmbedding, vector);
        
        if (similarity >= threshold) {
          results.push({
            id,
            content: document.content,
            metadata: document.metadata,
            similarity,
            timestamp: document.timestamp
          });
        }
      }
      
      // Sort by similarity (highest first) and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      return results.slice(0, limit);
      
    } catch (error) {
      console.error('Error searching similar documents:', error);
      throw error;
    }
  }

  async findSimilarUsers(userProfile, options = {}) {
    const {
      limit = 5,
      threshold = 0.8
    } = options;
    
    // Create a profile description for similarity search
    const profileDescription = `
      User profile: ${userProfile.age} year old ${userProfile.gender}, 
      ${userProfile.bodyType} body type, ${userProfile.culture} background, 
      ${userProfile.activity_level} activity level, 
      goals: ${userProfile.goals.join(', ')}
    `;
    
    return await this.searchSimilar(profileDescription, {
      limit,
      threshold,
      where: { type: 'profile' },
      excludeIds: [userProfile.userId || userProfile.id]
    });
  }

  async findSimilarLogs(logContent, userId, options = {}) {
    const {
      limit = 5,
      threshold = 0.7
    } = options;
    
    return await this.searchSimilar(logContent, {
      limit,
      threshold,
      where: { 
        type: 'log',
        userId: userId
      }
    });
  }

  async getRecommendations(userProfile, userLogs, options = {}) {
    const {
      limit = 3,
      types = ['nutrition', 'exercise', 'lifestyle']
    } = options;
    
    const recommendations = [];
    
    // Find similar users for pattern-based recommendations
    const similarUsers = await this.findSimilarUsers(userProfile, { limit: 3 });
    
    for (const similarUser of similarUsers) {
      // Get successful patterns from similar users
      const userLogs = await this.searchSimilar('successful health patterns', {
        limit: 5,
        where: { 
          type: 'log',
          userId: similarUser.id,
          success: true
        }
      });
      
      recommendations.push({
        type: 'pattern',
        source: 'similar_user',
        user: similarUser.metadata,
        patterns: userLogs,
        confidence: similarUser.similarity
      });
    }
    
    // Generate type-specific recommendations
    for (const type of types) {
      const typeRecommendations = await this.searchSimilar(
        `${type} recommendations for ${userProfile.bodyType} body type ${userProfile.culture} culture`,
        {
          limit: 2,
          where: { type: 'recommendation', category: type }
        }
      );
      
      recommendations.push({
        type: 'recommendation',
        category: type,
        suggestions: typeRecommendations,
        confidence: typeRecommendations.length > 0 ? typeRecommendations[0].similarity : 0
      });
    }
    
    return recommendations;
  }

  async analyzeTrends(userId, options = {}) {
    const {
      timeframe = 30, // days
      categories = ['all']
    } = options;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframe);
    
    // Get user's recent logs
    const recentLogs = await this.searchSimilar('recent activity', {
      limit: 100,
      where: { 
        type: 'log',
        userId: userId
      }
    });
    
    // Filter by date
    const filteredLogs = recentLogs.filter(log => 
      new Date(log.timestamp) >= cutoffDate
    );
    
    // Analyze patterns
    const trends = {
      totalLogs: filteredLogs.length,
      categories: {},
      patterns: [],
      insights: []
    };
    
    // Categorize logs
    for (const log of filteredLogs) {
      const category = log.metadata.input_method || 'unknown';
      if (!trends.categories[category]) {
        trends.categories[category] = 0;
      }
      trends.categories[category]++;
    }
    
    // Generate insights
    if (trends.totalLogs > 0) {
      trends.insights.push(`User has been active with ${trends.totalLogs} logs in the past ${timeframe} days`);
      
      const mostActiveCategory = Object.entries(trends.categories)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (mostActiveCategory) {
        trends.insights.push(`Most active category: ${mostActiveCategory[0]} (${mostActiveCategory[1]} entries)`);
      }
    }
    
    return trends;
  }

  async getDocument(id) {
    await this.initialize();
    return this.documents.get(id) || null;
  }

  async deleteDocument(id) {
    await this.initialize();
    
    this.vectors.delete(id);
    this.documents.delete(id);
    
    await this.saveVectors();
    console.log(`Deleted document ${id} from vector database`);
  }

  async getStats() {
    await this.initialize();
    
    const stats = {
      totalVectors: this.vectors.size,
      totalDocuments: this.documents.size,
      types: {},
      recentActivity: []
    };
    
    // Count by type
    for (const [id, doc] of this.documents) {
      const type = doc.metadata.type || 'unknown';
      stats.types[type] = (stats.types[type] || 0) + 1;
    }
    
    // Get recent activity (last 10 documents)
    const sortedDocs = Array.from(this.documents.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
    
    stats.recentActivity = sortedDocs.map(doc => ({
      id: doc.id,
      type: doc.metadata.type,
      timestamp: doc.timestamp
    }));
    
    return stats;
  }
}

module.exports = { vectorDB: new VectorDatabase() };
