import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { docService } from '../services/docService';
import { Navbar } from '../components/ui/Navbar';
import { TemplateBar } from '../components/dashboard/TemplateBar';
import { DocumentCard } from '../components/dashboard/DocumentCard';
import { RenameModal } from '../components/dashboard/RenameModal';
import { DeleteModal } from '../components/dashboard/DeleteModal';
import { Alert } from '../components/ui/Alert';
import { ShareModal } from '../components/editor/ShareModal';
import {
  FileText,
  Search,
  LayoutGrid,
  List,
  Loader2,
  FolderOpen,
  Plus,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Documents state
  const [ownedDocs, setOwnedDocs] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [shareTarget, setShareTarget] = useState(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'owned' | 'shared'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals state
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch documents on mount
  const fetchDocuments = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await docService.getDocuments();
      setOwnedDocs(data.owned || []);
      setSharedDocs(data.shared || []);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to load documents. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filtered documents based on active tab and search query
  const displayedDocuments = useMemo(() => {
    let pool = [];
    if (activeTab === 'all') pool = [...ownedDocs, ...sharedDocs];
    else if (activeTab === 'owned') pool = ownedDocs;
    else if (activeTab === 'shared') pool = sharedDocs;

    if (!searchQuery.trim()) return pool;

    const q = searchQuery.toLowerCase();
    return pool.filter((doc) => doc.title.toLowerCase().includes(q));
  }, [ownedDocs, sharedDocs, activeTab, searchQuery]);

  // Create document handler
  const handleCreateDocument = async (title) => {
    setIsCreating(true);
    setErrorMessage('');
    try {
      const data = await docService.createDocument(title);
      navigate(`/document/${data.document.id}`);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to create new document.'
      );
      setIsCreating(false);
    }
  };

  // Rename document handler
  const handleRenameDocument = async (id, newTitle) => {
    setModalLoading(true);
    try {
      const data = await docService.updateDocumentTitle(id, newTitle);
      setOwnedDocs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, title: data.document.title } : d))
      );
      setSharedDocs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, title: data.document.title } : d))
      );
      setSuccessMessage('Document renamed successfully');
      setRenameTarget(null);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to rename document'
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Delete document handler
  const handleDeleteDocument = async (id) => {
    setModalLoading(true);
    try {
      await docService.deleteDocument(id);
      setOwnedDocs((prev) => prev.filter((d) => d.id !== id));
      setSharedDocs((prev) => prev.filter((d) => d.id !== id));
      setSuccessMessage('Document deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to delete document'
      );
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Template Bar */}
      <TemplateBar
        onCreateDocument={handleCreateDocument}
        isCreating={isCreating}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Alerts */}
        {errorMessage && (
          <Alert
            variant="error"
            message={errorMessage}
            onClose={() => setErrorMessage('')}
            className="mb-6"
          />
        )}
        {successMessage && (
          <Alert
            variant="success"
            message={successMessage}
            onClose={() => setSuccessMessage('')}
            className="mb-6"
          />
        )}

        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({ownedDocs.length + sharedDocs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('owned')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'owned'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Owned by me ({ownedDocs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shared')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'shared'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shared with me ({sharedDocs.length})
            </button>
          </div>

          {/* Search & View Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 text-blue-600'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-100 text-blue-600'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={fetchDocuments}
              title="Refresh"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Grid / List Content */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading your documents...</p>
          </div>
        ) : displayedDocuments.length === 0 ? (
          <div className="py-16 bg-white border border-slate-200/80 rounded-2xl text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery
                ? `No documents matching "${searchQuery}". Try a different keyword.`
                : 'Get started by creating your first blank document or choosing a starter template.'}
            </p>
            <button
              type="button"
              onClick={() => handleCreateDocument('Untitled Document')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Blank Document
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayedDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onOpenRename={(d) => setRenameTarget(d)}
                onOpenDelete={(d) => setDeleteTarget(d)}
                onOpenShare={(d) => setShareTarget(d)}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onOpenRename={(d) => setRenameTarget(d)}
                onOpenDelete={(d) => setDeleteTarget(d)}
                onOpenShare={(d) => setShareTarget(d)}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <RenameModal
        isOpen={!!renameTarget}
        document={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRename={handleRenameDocument}
        isLoading={modalLoading}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        document={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirmDelete={handleDeleteDocument}
        isLoading={modalLoading}
      />

      <ShareModal
        isOpen={!!shareTarget}
        document={shareTarget}
        userRole={shareTarget?.userRole}
        onClose={() => setShareTarget(null)}
      />
    </div>
  );
};