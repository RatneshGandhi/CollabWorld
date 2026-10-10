import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { docService } from '../services/docService';
import { socketService } from '../services/socketService';
import { EditorHeader } from '../components/editor/EditorHeader';
import { TextEditor } from '../components/editor/TextEditor';
import { ShareModal } from '../components/editor/ShareModal';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  // Document metadata state
  const [document, setDocument] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // WebSocket connection state: 'connecting' | 'connected' | 'disconnected'
  const [socketStatus, setSocketStatus] = useState('connecting');

  // Editor instance & save state
  const [quillInstance, setQuillInstance] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'unsaved' | 'saving' | 'error'

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Refs for debouncing, clean unmounts, and initial load guard
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
      window.document.title = 'CollabSpace — Real-Time Collaborative Workspace';
    };
  }, [id]);

  // 2. Connect to Socket.IO & join document room
  useEffect(() => {
    if (!id || !token || !document) return;

    setSocketStatus('connecting');

    const socket = socketService.connect(token);
    if (!socket) return;

    const handleConnect = async () => {
      console.log('[EditorPage] Socket connected, joining document room:', id);
      const res = await socketService.joinDocument(id);
      if (res?.success) {
        setSocketStatus('connected');
        console.log('[EditorPage] Successfully joined room with role:', res.userRole);
      } else {
        setSocketStatus('disconnected');
        console.error('[EditorPage] Failed to join document room:', res?.error);
      }
    };

    const handleDisconnect = () => {
      setSocketStatus('disconnected');
    };

    const handleConnectError = () => {
      setSocketStatus('disconnected');
    };

    const handleUserJoined = (data) => {
      console.log('[EditorPage] Peer collaborator joined room:', data.user.name);
    };

    const handleUserLeft = (data) => {
      console.log('[EditorPage] Peer collaborator left room:', data.user.name);
    };

    // Real-Time Delta Receiver: Apply remote changes from peers instantly
    const handleReceiveChanges = (data) => {
      if (!quillInstance || !data?.delta) return;
      // CRITICAL: Applying with quillInstance.updateContents triggers 'text-change' with source === 'api'
      // Our text-change listener ignores source !== 'user', completely preventing echo loops!
      quillInstance.updateContents(data.delta);
    };

    // Real-Time Title Sync: Update title when a peer renames it
    const handleReceiveTitleChange = (data) => {
      if (!data?.title) return;
      setDocument((prev) => ({ ...prev, title: data.title }));
      window.document.title = `${data.title} — CollabSpace Docs`;
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('receive-changes', handleReceiveChanges);
    socket.on('receive-title-change', handleReceiveTitleChange);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('receive-changes', handleReceiveChanges);
      socket.off('receive-title-change', handleReceiveTitleChange);
      socketService.leaveDocument(id);
    };
  }, [id, token, document?.id, quillInstance]);

  // 3. Hydrate Quill with initial Delta once both Quill and Document are ready
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

    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, [quillInstance, document?.id, userRole]);

  // 4. Save function that persists Delta snapshot to PostgreSQL
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

  // 5. Attach Quill 'text-change' listener for Real-Time Broadcasting & Debounced Auto-Save
  useEffect(() => {
    if (!quillInstance || userRole === 'viewer') return;

    const handleTextChange = (delta, oldDelta, source) => {
      // CRITICAL: Ignore programmatic changes (e.g. setContents on mount or receive-changes from peers)
      if (source !== 'user' || isInitialLoadRef.current) return;

      // 1. BROADCAST DELTA TO PEERS IMMEDIATELY (<15ms)
      socketService.sendChanges(id, delta);

      // 2. Mark local save status as unsaved
      setSaveStatus('unsaved');

      // 3. Debounce database persistence snapshot (1500ms inactivity)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

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
  }, [quillInstance, userRole, id, performSave]);

  // 6. Browser tab exit protection (warn if unsaved)
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

  // 7. Inline Title Renaming Handler (Updates DB & Broadcasts to Peers)
  const handleRenameTitle = async (newTitle) => {
    try {
      const updated = await docService.updateDocumentTitle(id, newTitle);
      setDocument((prev) => ({ ...prev, title: updated.document.title }));
      window.document.title = `${updated.document.title} — CollabSpace Docs`;

      // Broadcast title rename to peer collaborators in the room
      socketService.sendTitleChange(id, updated.document.title);
    } catch (err) {
      console.error('Failed to rename document title:', err);
    }
  };

  // 8. Stable callback ref for TextEditor
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
      {/* Top Header with Inline Renaming, Save Status, Socket Status & Share Trigger */}
      <EditorHeader
        document={document}
        userRole={userRole}
        saveStatus={saveStatus}
        socketStatus={socketStatus}
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
