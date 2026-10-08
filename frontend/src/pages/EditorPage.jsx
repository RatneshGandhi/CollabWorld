import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { docService } from '../services/docService';
import { EditorHeader } from '../components/editor/EditorHeader';
import { TextEditor } from '../components/editor/TextEditor';
import { ShareModal } from '../components/editor/ShareModal';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Document metadata state
  const [document, setDocument] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Editor instance & save state
  const [quillInstance, setQuillInstance] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'unsaved' | 'saving' | 'error'

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Refs for debouncing and clean unmounts
  const saveTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // 1. Fetch document metadata & content on mount
  useEffect(() => {
    let isMounted = true;

    const fetchDoc = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await docService.getDocumentById(id);
        if (isMounted) {
          setDocument(data.document);
          setUserRole(data.userRole);
          // Sync browser tab title
          window.document.title = `${data.document.title || 'Untitled Document'} — CollabSpace Docs`;
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err?.response?.data?.message || 'Failed to load document.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDoc();

    return () => {
      isMounted = false;
      // Reset tab title on leave
      window.document.title = 'CollabSpace — Real-Time Collaborative Workspace';
    };
  }, [id]);

  // 2. Hydrate Quill with initial Delta once both Quill and Document are ready
  useEffect(() => {
    if (!quillInstance || !document) return;

    if (document.data && document.data.ops) {
      quillInstance.setContents(document.data);
    }

    if (userRole === 'viewer') {
      quillInstance.enable(false);
    } else {
      quillInstance.enable(true);
    }

    // Mark initial loading as complete after a short tick
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, [quillInstance, document?.id, userRole]);

  // 3. Save function that persists Delta snapshot to PostgreSQL
  const performSave = useCallback(async () => {
    if (!quillInstance || userRole === 'viewer') return;

    setSaveStatus('saving');
    try {
      const contents = quillInstance.getContents();
      await docService.saveDocumentData(id, contents);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to auto-save document:', err);
      setSaveStatus('error');
    }
  }, [id, quillInstance, userRole]);

  // 4. Attach Quill 'text-change' listener for Debounced Auto-Save
  useEffect(() => {
    if (!quillInstance || userRole === 'viewer') return;

    const handleTextChange = (delta, oldDelta, source) => {
      // CRITICAL: Ignore programmatic changes (e.g. setContents on mount)
      if (source !== 'user' || isInitialLoadRef.current) return;

      setSaveStatus('unsaved');

      // Clear existing debounce timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Schedule new save after 1500ms of typing inactivity
      saveTimerRef.current = setTimeout(() => {
        performSave();
      }, 1500);
    };

    quillInstance.on('text-change', handleTextChange);

    return () => {
      quillInstance.off('text-change', handleTextChange);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [quillInstance, userRole, performSave]);

  // 5. Browser tab exit protection (warn if unsaved)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === 'unsaved' || saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // 6. Inline Title Renaming Handler
  const handleRenameTitle = async (newTitle) => {
    try {
      const updated = await docService.updateDocumentTitle(id, newTitle);
      setDocument((prev) => ({ ...prev, title: updated.document.title }));
      window.document.title = `${updated.document.title} — CollabSpace Docs`;
    } catch (err) {
      console.error('Failed to rename document title:', err);
    }
  };

  // 7. Stable callback ref for TextEditor
  const handleEditorReady = useCallback((q) => {
    setQuillInstance(q);
  }, []);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Opening document canvas...</p>
      </div>
    );
  }

  // Error Screen (404 / 403)
  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200/80 text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">
            Unable to Open Document
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            {errorMessage}
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header with Inline Renaming and Reactive Save Status */}
      <EditorHeader
        document={document}
        userRole={userRole}
        saveStatus={saveStatus}
        onRenameTitle={handleRenameTitle}
        onRetrySave={performSave}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* Editor Canvas */}
      <TextEditor
        onEditorReady={handleEditorReady}
        userRole={userRole}
      />

      {/* In-Editor Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={document}
        userRole={userRole}
      />
    </div>
  );
};