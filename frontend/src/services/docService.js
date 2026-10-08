import api from './api';

export const docService = {
  /**
   * Fetch all documents owned by or shared with current user
   * @returns {Promise<{ owned: Array, shared: Array }>}
   */
  async getDocuments() {
    const response = await api.get('/documents');
    return response.data.data;
  },

  /**
   * Fetch a single document by ID (includes delta data & userRole)
   * @param {string} id
   */
  async getDocumentById(id) {
    const response = await api.get(`/documents/${id}`);
    return response.data.data;
  },

  /**
   * Create a new document with optional title
   * @param {string} title
   * @returns {Promise<{ document: Object, userRole: string }>}
   */
  async createDocument(title = 'Untitled Document') {
    const response = await api.post('/documents', { title });
    return response.data.data;
  },

  /**
   * Update a document's title
   * @param {string} id
   * @param {string} title
   */
  async updateDocumentTitle(id, title) {
    const response = await api.patch(`/documents/${id}`, { title });
    return response.data.data;
  },

  /**
   * Save document delta content (Auto-save)
   * @param {string} id
   * @param {Object} data (Quill Delta object)
   */
  async saveDocumentData(id, data) {
    const response = await api.put(`/documents/${id}/save`, { data });
    return response.data.data;
  },

  /**
   * Delete a document (Owner only)
   * @param {string} id
   */
  async deleteDocument(id) {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  /**
   * Fetch collaborators for a document
   * @param {string} id
   */
  async getCollaborators(id) {
    const response = await api.get(`/documents/${id}/collaborators`);
    return response.data.data;
  },

  /**
   * Invite a collaborator by email
   * @param {string} id
   * @param {{ email: string, role: 'viewer' | 'editor' }} data
   */
  async addCollaborator(id, { email, role }) {
    const response = await api.post(`/documents/${id}/collaborators`, { email, role });
    return response.data.data;
  },

  /**
   * Remove a collaborator
   * @param {string} id
   * @param {number} userId
   */
  async removeCollaborator(id, userId) {
    const response = await api.delete(`/documents/${id}/collaborators/${userId}`);
    return response.data;
  },
};