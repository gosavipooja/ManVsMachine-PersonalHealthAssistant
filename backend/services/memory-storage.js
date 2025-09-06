// Simple in-memory storage service to replace Weaviate for local testing
class MemoryStorageService {
  constructor() {
    this.documents = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('Memory storage initialized successfully');
  }

  async addDocument(document) {
    await this.initialize();
    
    try {
      const docData = {
        id: document.id,
        content: document.content,
        metadata: document.metadata,
        timestamp: new Date().toISOString()
      };
      
      this.documents.set(document.id, docData);
      console.log(`Document added: ${document.id}`);
      return { id: document.id };
    } catch (error) {
      console.error('Failed to add document to memory storage:', error);
      throw error;
    }
  }

  async searchSimilar(query, limit = 5, where, userId) {
    await this.initialize();
    
    try {
      const results = [];
      for (const [id, doc] of this.documents) {
        // Simple text matching for demo purposes
        if (doc.content.toLowerCase().includes(query.toLowerCase())) {
          if (!userId || doc.metadata.userId === userId) {
            results.push({
              content: doc.content,
              type: doc.metadata.type,
              habitId: doc.metadata.habitId || '',
              userId: doc.metadata.userId || '',
              timestamp: doc.metadata.timestamp,
              metadata: doc.metadata,
              _additional: { id: id, distance: 0.5 }
            });
          }
        }
      }
      return results.slice(0, limit);
    } catch (error) {
      console.error('Failed to search memory storage:', error);
      throw error;
    }
  }

  async getDocumentsByType(type, userId, limit = 10) {
    await this.initialize();
    
    try {
      const results = [];
      for (const [id, doc] of this.documents) {
        if (doc.metadata.type === type) {
          if (!userId || doc.metadata.userId === userId) {
            results.push({
              content: doc.content,
              type: doc.metadata.type,
              habitId: doc.metadata.habitId || '',
              userId: doc.metadata.userId || '',
              timestamp: doc.metadata.timestamp,
              metadata: doc.metadata,
              _additional: { id: id }
            });
          }
        }
      }
      return results.slice(0, limit);
    } catch (error) {
      console.error('Failed to get documents by type:', error);
      throw error;
    }
  }

  async deleteDocument(id) {
    await this.initialize();
    
    try {
      this.documents.delete(id);
      console.log(`Document deleted: ${id}`);
    } catch (error) {
      console.error('Failed to delete document from memory storage:', error);
      throw error;
    }
  }

  async updateDocument(id, document) {
    await this.initialize();
    
    try {
      await this.deleteDocument(id);
      await this.addDocument(document);
    } catch (error) {
      console.error('Failed to update document in memory storage:', error);
      throw error;
    }
  }

  async getDocumentById(id) {
    await this.initialize();
    
    try {
      const doc = this.documents.get(id);
      return doc || null;
    } catch (error) {
      console.error('Failed to get document by ID:', error);
      throw error;
    }
  }

  async getSimilarLogs(habitId, userId, limit = 5) {
    await this.initialize();
    
    try {
      const results = [];
      for (const [id, doc] of this.documents) {
        if (doc.metadata.type === 'log' && 
            doc.metadata.habitId === habitId && 
            doc.metadata.userId === userId) {
          results.push({
            content: doc.content,
            type: doc.metadata.type,
            habitId: doc.metadata.habitId,
            userId: doc.metadata.userId,
            timestamp: doc.metadata.timestamp,
            metadata: doc.metadata,
            _additional: { id: id, distance: 0.5 }
          });
        }
      }
      return results.slice(0, limit);
    } catch (error) {
      console.error('Failed to get similar logs:', error);
      throw error;
    }
  }

  async getCoachingHistory(userId, limit = 10) {
    await this.initialize();
    
    try {
      const results = [];
      for (const [id, doc] of this.documents) {
        if (doc.metadata.type === 'coaching' && doc.metadata.userId === userId) {
          results.push({
            content: doc.content,
            type: doc.metadata.type,
            habitId: doc.metadata.habitId || '',
            userId: doc.metadata.userId,
            timestamp: doc.metadata.timestamp,
            metadata: doc.metadata,
            _additional: { id: id }
          });
        }
      }
      // Sort by timestamp descending
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return results.slice(0, limit);
    } catch (error) {
      console.error('Failed to get coaching history:', error);
      throw error;
    }
  }
}

module.exports = { weaviateService: new MemoryStorageService() };