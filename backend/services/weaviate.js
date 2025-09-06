const weaviate = require('weaviate-ts-client');

class WeaviateService {
  constructor() {
    const weaviateUrl = process.env.WEAVIATE_URL || 'http://localhost:8080';
    const apiKey = process.env.WEAVIATE_API_KEY;

    this.client = weaviate.client({
      scheme: 'http',
      host: weaviateUrl.replace('http://', '').replace('https://', ''),
      apiKey: apiKey ? new (weaviate.ApiKey)(apiKey) : undefined,
    });
    
    this.isInitialized = false;
    this.className = 'HealthData';
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Check if class exists, create if not
      const classExists = await this.client.schema.exists(this.className);
      
      if (!classExists) {
        await this.client.schema
          .classCreator()
          .withClass({
            class: this.className,
            description: 'Personal health assistant data',
            vectorizer: 'text2vec-openai', // or 'text2vec-transformers' for local
            properties: [
              {
                name: 'content',
                dataType: ['text'],
                description: 'The main content of the document',
              },
              {
                name: 'type',
                dataType: ['text'],
                description: 'Type of document (log, profile, coaching, chat)',
              },
              {
                name: 'habitId',
                dataType: ['text'],
                description: 'ID of the associated habit',
              },
              {
                name: 'userId',
                dataType: ['text'],
                description: 'ID of the user',
              },
              {
                name: 'timestamp',
                dataType: ['text'],
                description: 'Timestamp of the document',
              },
              {
                name: 'metadata',
                dataType: ['object'],
                description: 'Additional metadata',
              },
            ],
          });
      }
      
      this.isInitialized = true;
      console.log('Weaviate initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Weaviate:', error);
      throw error;
    }
  }

  async addDocument(document) {
    await this.initialize();
    
    try {
      const result = await this.client.data
        .creator()
        .withClassName(this.className)
        .withProperties({
          content: document.content,
          type: document.metadata.type,
          habitId: document.metadata.habitId || '',
          userId: document.metadata.userId || '',
          timestamp: document.metadata.timestamp,
          metadata: document.metadata,
        })
        .withId(document.id)
        .do();

      return result;
    } catch (error) {
      console.error('Failed to add document to Weaviate:', error);
      throw error;
    }
  }

  async searchSimilar(query, limit = 5, where, userId) {
    await this.initialize();
    
    try {
      let searchQuery = this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('content type habitId userId timestamp metadata _additional { id distance }')
        .withNearText({ concepts: [query] })
        .withLimit(limit);

      // Add user filter if provided
      if (userId) {
        searchQuery = searchQuery.withWhere({
          path: ['userId'],
          operator: 'Equal',
          valueText: userId,
        });
      }

      // Add additional where conditions if provided
      if (where) {
        searchQuery = searchQuery.withWhere(where);
      }

      const result = await searchQuery.do();
      return result.data?.Get?.[this.className] || [];
    } catch (error) {
      console.error('Failed to search Weaviate:', error);
      throw error;
    }
  }

  async getDocumentsByType(type, userId, limit = 10) {
    await this.initialize();
    
    try {
      let query = this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('content type habitId userId timestamp metadata _additional { id }')
        .withWhere({
          path: ['type'],
          operator: 'Equal',
          valueText: type,
        })
        .withLimit(limit);

      if (userId) {
        query = query.withWhere({
          operator: 'And',
          operands: [
            {
              path: ['type'],
              operator: 'Equal',
              valueText: type,
            },
            {
              path: ['userId'],
              operator: 'Equal',
              valueText: userId,
            },
          ],
        });
      }

      const result = await query.do();
      return result.data?.Get?.[this.className] || [];
    } catch (error) {
      console.error('Failed to get documents by type:', error);
      throw error;
    }
  }

  async deleteDocument(id) {
    await this.initialize();
    
    try {
      await this.client.data
        .deleter()
        .withClassName(this.className)
        .withId(id)
        .do();
    } catch (error) {
      console.error('Failed to delete document from Weaviate:', error);
      throw error;
    }
  }

  async updateDocument(id, document) {
    await this.initialize();
    
    try {
      // Weaviate doesn't have direct update, so we delete and re-add
      await this.deleteDocument(id);
      await this.addDocument(document);
    } catch (error) {
      console.error('Failed to update document in Weaviate:', error);
      throw error;
    }
  }

  async getDocumentById(id) {
    await this.initialize();
    
    try {
      const result = await this.client.data
        .getterById()
        .withClassName(this.className)
        .withId(id)
        .do();

      return result;
    } catch (error) {
      console.error('Failed to get document by ID:', error);
      throw error;
    }
  }

  async getSimilarLogs(habitId, userId, limit = 5) {
    await this.initialize();
    
    try {
      const result = await this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('content type habitId userId timestamp metadata _additional { id distance }')
        .withWhere({
          operator: 'And',
          operands: [
            {
              path: ['type'],
              operator: 'Equal',
              valueText: 'log',
            },
            {
              path: ['habitId'],
              operator: 'Equal',
              valueText: habitId,
            },
            {
              path: ['userId'],
              operator: 'Equal',
              valueText: userId,
            },
          ],
        })
        .withLimit(limit)
        .do();

      return result.data?.Get?.[this.className] || [];
    } catch (error) {
      console.error('Failed to get similar logs:', error);
      throw error;
    }
  }

  async getCoachingHistory(userId, limit = 10) {
    await this.initialize();
    
    try {
      const result = await this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('content type habitId userId timestamp metadata _additional { id }')
        .withWhere({
          operator: 'And',
          operands: [
            {
              path: ['type'],
              operator: 'Equal',
              valueText: 'coaching',
            },
            {
              path: ['userId'],
              operator: 'Equal',
              valueText: userId,
            },
          ],
        })
        .withSort([{ path: ['timestamp'], order: 'desc' }])
        .withLimit(limit)
        .do();

      return result.data?.Get?.[this.className] || [];
    } catch (error) {
      console.error('Failed to get coaching history:', error);
      throw error;
    }
  }
}

module.exports = { weaviateService: new WeaviateService() };
