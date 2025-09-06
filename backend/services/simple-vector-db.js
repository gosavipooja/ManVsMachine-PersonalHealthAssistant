const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SimpleVectorDB {
  constructor() {
    if (SimpleVectorDB.instance) {
      return SimpleVectorDB.instance;
    }
    SimpleVectorDB.instance = this;
    
    this.dbPath = path.join(__dirname, '../data/vector_db');
    this.collectionsPath = path.join(this.dbPath, 'collections.json');
    this.documentsPath = path.join(this.dbPath, 'documents.json');
    
    this.initialize();
  }

  /**
   * Initialize the vector database
   */
  initialize() {
    try {
      // Create database directory if it doesn't exist
      if (!fs.existsSync(this.dbPath)) {
        fs.mkdirSync(this.dbPath, { recursive: true });
      }

      // Initialize collections file
      if (!fs.existsSync(this.collectionsPath)) {
        fs.writeFileSync(this.collectionsPath, JSON.stringify({}, null, 2));
      }

      // Initialize documents file
      if (!fs.existsSync(this.documentsPath)) {
        fs.writeFileSync(this.documentsPath, JSON.stringify({}, null, 2));
      }

      console.log('✅ Simple Vector DB initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Simple Vector DB:', error);
      throw error;
    }
  }

  /**
   * Load collections from file
   */
  loadCollections() {
    try {
      const data = fs.readFileSync(this.collectionsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  /**
   * Save collections to file
   */
  saveCollections(collections) {
    try {
      fs.writeFileSync(this.collectionsPath, JSON.stringify(collections, null, 2));
    } catch (error) {
      console.error('Error saving collections:', error);
      throw error;
    }
  }

  /**
   * Load documents from file
   */
  loadDocuments() {
    try {
      const data = fs.readFileSync(this.documentsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  /**
   * Save documents to file
   */
  saveDocuments(documents) {
    try {
      fs.writeFileSync(this.documentsPath, JSON.stringify(documents, null, 2));
    } catch (error) {
      console.error('Error saving documents:', error);
      throw error;
    }
  }

  /**
   * Create a simple embedding from text (basic text processing)
   * @param {string} text - Text to create embedding for
   * @returns {Array} Simple embedding vector
   */
  createSimpleEmbedding(text) {
    // Simple text processing for basic similarity
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Create a simple bag-of-words vector
    const embedding = {};
    words.forEach(word => {
      embedding[word] = (embedding[word] || 0) + 1;
    });
    
    return embedding;
  }

  /**
   * Calculate simple cosine similarity between two embeddings
   * @param {Object} embedding1 - First embedding
   * @param {Object} embedding2 - Second embedding
   * @returns {number} Similarity score
   */
  calculateSimilarity(embedding1, embedding2) {
    const keys1 = Object.keys(embedding1);
    const keys2 = Object.keys(embedding2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const key of allKeys) {
      const val1 = embedding1[key] || 0;
      const val2 = embedding2[key] || 0;
      
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Get or create a collection
   * @param {string} name - Collection name
   * @returns {Object} Collection info
   */
  getOrCreateCollection(name) {
    const collections = this.loadCollections();
    
    if (!collections[name]) {
      collections[name] = {
        name: name,
        created_at: new Date().toISOString(),
        document_count: 0
      };
      this.saveCollections(collections);
    }
    
    return collections[name];
  }

  /**
   * Add a document to the vector database
   * @param {Object} document - Document to add
   * @returns {Object} Result of the operation
   */
  async addDocument(document) {
    try {
      const docId = document.id || uuidv4();
      const collectionName = 'health_data'; // Default collection
      
      // Get or create collection
      this.getOrCreateCollection(collectionName);
      
      // Create embedding from document content
      const content = this.extractContent(document);
      const embedding = this.createSimpleEmbedding(content);
      
      // Prepare document data
      const docData = {
        id: docId,
        content: content,
        embedding: embedding,
        metadata: {
          type: document.type || 'unknown',
          user_id: document.userId || document.user_id || 'unknown',
          timestamp: document.timestamp || new Date().toISOString(),
          source: document.source || 'api',
          original_data: JSON.stringify(document)
        },
        created_at: new Date().toISOString()
      };
      
      // Load and update documents
      const documents = this.loadDocuments();
      documents[docId] = docData;
      this.saveDocuments(documents);
      
      // Update collection count
      const collections = this.loadCollections();
      collections[collectionName].document_count = Object.keys(documents).length;
      this.saveCollections(collections);
      
      console.log(`✅ Document added to Simple Vector DB: ${docId}`);
      return {
        success: true,
        id: docId,
        message: `Document ${docId} added successfully`
      };
      
    } catch (error) {
      console.error('❌ Failed to add document to Simple Vector DB:', error);
      return {
        success: false,
        error: error.message,
        message: `Failed to add document: ${error.message}`
      };
    }
  }

  /**
   * Extract content from document for embedding
   * @param {Object} document - Document to extract content from
   * @returns {string} Extracted content
   */
  extractContent(document) {
    const parts = [];
    
    if (document.type === 'food' && document.data && document.data.items) {
      document.data.items.forEach(item => {
        parts.push(`Food: ${item.name} - ${item.quantity} ${item.unit}`);
        if (item.macros) {
          parts.push(`Nutrition: ${item.macros.calories} calories, ${item.macros.protein_g}g protein, ${item.macros.carbs_g}g carbs, ${item.macros.fat_g}g fat`);
        }
      });
    } else if (document.type === 'exercise' && document.data) {
      parts.push(`Exercise: ${document.data.activity} for ${document.data.duration_min} minutes`);
      if (document.data.calories_burned) {
        parts.push(`Calories burned: ${document.data.calories_burned}`);
      }
      if (document.data.effort_level) {
        parts.push(`Effort level: ${document.data.effort_level}`);
      }
    } else if (document.type === 'profile' && document.metadata) {
      const meta = document.metadata;
      parts.push(`Profile: ${meta.name} - ${meta.age} year old ${meta.gender}`);
      parts.push(`Body type: ${meta.bodyType}, Goals: ${meta.goals ? meta.goals.join(', ') : 'none'}`);
    }
    
    return parts.join(' | ');
  }

  /**
   * Search for similar documents
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @param {Object} where - Filter conditions
   * @returns {Array} Search results
   */
  async searchSimilar(query, limit = 10, where = {}) {
    try {
      const documents = this.loadDocuments();
      const queryEmbedding = this.createSimpleEmbedding(query);
      
      // Calculate similarities
      const similarities = [];
      
      for (const [docId, doc] of Object.entries(documents)) {
        // Apply filters
        if (where.type && doc.metadata.type !== where.type) continue;
        if (where.user_id && doc.metadata.user_id !== where.user_id) continue;
        
        const similarity = this.calculateSimilarity(queryEmbedding, doc.embedding);
        similarities.push({
          id: docId,
          content: doc.content,
          metadata: doc.metadata,
          similarity: similarity
        });
      }
      
      // Sort by similarity and limit results
      similarities.sort((a, b) => b.similarity - a.similarity);
      return similarities.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Failed to search Simple Vector DB:', error);
      return [];
    }
  }

  /**
   * Get documents by type and user
   * @param {string} type - Document type
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of results
   * @returns {Array} Documents
   */
  async getDocumentsByType(type, userId, limit = 50) {
    try {
      const documents = this.loadDocuments();
      const filteredDocs = [];
      
      for (const [docId, doc] of Object.entries(documents)) {
        if (doc.metadata.type === type && doc.metadata.user_id === userId) {
          filteredDocs.push({
            id: docId,
            content: doc.content,
            metadata: doc.metadata,
            timestamp: doc.metadata.timestamp
          });
        }
      }
      
      // Sort by timestamp (newest first)
      filteredDocs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return filteredDocs.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Failed to get documents by type:', error);
      return [];
    }
  }

  /**
   * Get recent documents for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to look back
   * @param {number} limit - Maximum number of results
   * @returns {Object} Recent documents grouped by type
   */
  async getRecentDocuments(userId, days = 7, limit = 50) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const documents = this.loadDocuments();
      const recentDocs = {
        food: [],
        exercise: [],
        profile: [],
        other: []
      };
      
      for (const [docId, doc] of Object.entries(documents)) {
        if (doc.metadata.user_id === userId) {
          const docDate = new Date(doc.metadata.timestamp);
          
          if (docDate >= cutoffDate) {
            const docData = {
              id: docId,
              content: doc.content,
              metadata: doc.metadata,
              timestamp: doc.metadata.timestamp
            };
            
            const docType = doc.metadata.type || 'other';
            if (recentDocs[docType]) {
              recentDocs[docType].push(docData);
            } else {
              recentDocs.other.push(docData);
            }
          }
        }
      }
      
      // Sort each type by timestamp
      for (const docType in recentDocs) {
        recentDocs[docType].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        recentDocs[docType] = recentDocs[docType].slice(0, limit);
      }
      
      return {
        success: true,
        documents: recentDocs,
        total_count: Object.values(recentDocs).reduce((sum, docs) => sum + docs.length, 0),
        date_range: {
          from: cutoffDate.toISOString(),
          to: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get recent documents:', error);
      return {
        success: false,
        error: error.message,
        documents: { food: [], exercise: [], profile: [], other: [] },
        total_count: 0
      };
    }
  }

  /**
   * Get collection statistics
   * @returns {Object} Collection statistics
   */
  async getStats() {
    try {
      const documents = this.loadDocuments();
      const collections = this.loadCollections();
      
      const typeCounts = {};
      for (const doc of Object.values(documents)) {
        const type = doc.metadata.type || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
      
      return {
        success: true,
        total_documents: Object.keys(documents).length,
        type_distribution: typeCounts,
        collections: collections
      };
      
    } catch (error) {
      console.error('❌ Failed to get Simple Vector DB stats:', error);
      return {
        success: false,
        error: error.message,
        total_documents: 0,
        type_distribution: {}
      };
    }
  }
}

module.exports = { simpleVectorDB: new SimpleVectorDB() };
