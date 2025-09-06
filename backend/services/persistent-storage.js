const fs = require('fs').promises;
const path = require('path');

// Enhanced storage service with JSON file persistence and multi-data-type support
class PersistentStorageService {
  constructor() {
    this.documents = new Map();
    this.isInitialized = false;
    this.dataDir = path.join(__dirname, '../data');
    this.dataTypes = new Set(); // Track different data types
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Load existing data from JSON files
      await this.loadFromFiles();
      
      this.isInitialized = true;
      console.log('Persistent storage initialized successfully');
      console.log(`Loaded data types: ${Array.from(this.dataTypes).join(', ')}`);
    } catch (error) {
      console.error('Failed to initialize persistent storage:', error);
      // Continue with in-memory only if file operations fail
      this.isInitialized = true;
    }
  }

  async loadFromFiles() {
    try {
      const files = await fs.readdir(this.dataDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const dataType = file.replace('.json', '');
        const filePath = path.join(this.dataDir, file);
        
        try {
          const fileContent = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(fileContent);
          
          // Load documents into memory
          for (const [id, doc] of Object.entries(data)) {
            this.documents.set(id, doc);
            this.dataTypes.add(dataType);
          }
          
          console.log(`Loaded ${Object.keys(data).length} ${dataType} documents`);
        } catch (fileError) {
          console.warn(`Failed to load ${file}:`, fileError.message);
        }
      }
    } catch (error) {
      console.log('No existing data files found, starting fresh');
    }
  }

  async saveToFile(dataType) {
    try {
      // Get all documents of this type
      const typeDocuments = {};
      for (const [id, doc] of this.documents) {
        if (doc.metadata && doc.metadata.type === dataType) {
          typeDocuments[id] = doc;
        }
      }
      
      // Save to JSON file
      const filePath = path.join(this.dataDir, `${dataType}.json`);
      await fs.writeFile(filePath, JSON.stringify(typeDocuments, null, 2));
      console.log(`Saved ${Object.keys(typeDocuments).length} ${dataType} documents to ${dataType}.json`);
    } catch (error) {
      console.error(`Failed to save ${dataType} data:`, error);
    }
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
      
      // Store in memory
      this.documents.set(document.id, docData);
      
      // Track data type
      const dataType = document.metadata.type;
      this.dataTypes.add(dataType);
      
      // Persist to file
      await this.saveToFile(dataType);
      
      console.log(`Document added: ${document.id} (type: ${dataType})`);
      return { id: document.id };
    } catch (error) {
      console.error('Failed to add document to persistent storage:', error);
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
      console.error('Failed to search persistent storage:', error);
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
      const doc = this.documents.get(id);
      if (doc) {
        const dataType = doc.metadata.type;
        this.documents.delete(id);
        
        // Update the file
        await this.saveToFile(dataType);
        console.log(`Document deleted: ${id} (type: ${dataType})`);
      }
    } catch (error) {
      console.error('Failed to delete document from persistent storage:', error);
      throw error;
    }
  }

  async updateDocument(id, document) {
    await this.initialize();
    
    try {
      const oldDoc = this.documents.get(id);
      const oldType = oldDoc ? oldDoc.metadata.type : null;
      
      await this.deleteDocument(id);
      await this.addDocument(document);
      
      // If type changed, update both files
      if (oldType && oldType !== document.metadata.type) {
        await this.saveToFile(oldType);
      }
    } catch (error) {
      console.error('Failed to update document in persistent storage:', error);
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

  // New utility methods for managing different data types
  async getDataTypes() {
    await this.initialize();
    return Array.from(this.dataTypes);
  }

  async getDocumentCountByType() {
    await this.initialize();
    const counts = {};
    
    for (const [id, doc] of this.documents) {
      const type = doc.metadata.type;
      counts[type] = (counts[type] || 0) + 1;
    }
    
    return counts;
  }

  async exportDataType(dataType) {
    await this.initialize();
    const typeDocuments = {};
    
    for (const [id, doc] of this.documents) {
      if (doc.metadata && doc.metadata.type === dataType) {
        typeDocuments[id] = doc;
      }
    }
    
    return typeDocuments;
  }

  async clearDataType(dataType) {
    await this.initialize();
    
    try {
      // Remove from memory
      const idsToDelete = [];
      for (const [id, doc] of this.documents) {
        if (doc.metadata && doc.metadata.type === dataType) {
          idsToDelete.push(id);
        }
      }
      
      idsToDelete.forEach(id => this.documents.delete(id));
      
      // Remove file
      const filePath = path.join(this.dataDir, `${dataType}.json`);
      try {
        await fs.unlink(filePath);
        console.log(`Cleared all ${dataType} data and removed file`);
      } catch (error) {
        console.log(`File ${dataType}.json didn't exist or couldn't be deleted`);
      }
      
      this.dataTypes.delete(dataType);
      return idsToDelete.length;
    } catch (error) {
      console.error(`Failed to clear ${dataType} data:`, error);
      throw error;
    }
  }
}

module.exports = { weaviateService: new PersistentStorageService() };