import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { docService } from '../services/docService';
import { socketService } from '../services/socketService';
import { EditorHeader } from '../components/editor/EditorHeader';
import { TextEditor } from '../components/editor/TextEditor';
import { ShareModal } from '../components/editor/ShareModal';
import { EditorSkeleton } from '../components/editor/EditorSkeleton';
import { AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();
  const { toast } = useToast();

  // Document metadata state
  const [document, setDocument] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // WebSocket connection state: 'connecting' | 'connected' | 'disconnected'
  const [socketStatus, setSocketStatus] = useState('connecting');

  // Real-Time Collaborators Presence State
  const [activeUsers, setActiveUsers] = useState([]);

  // Editor instance & synchronized save state
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
          const msg = err?.response?.data?.message || 'Failed to load document.';
          setErrorMessage(msg);
          toast.error(msg);
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

  // 2. Connect to Socket.IO, join room & track live collaborator presence
  useEffect(() => {
    if (!id || !token || !document) return;

    setSocketStatus('connecting');

    const socket = socketService.connect(token);
    if (!socket) return;

    const handleConnect = async () => {
      const res = await socketService.joinDocument(id);
      if (res?.success) {
        setSocketStatus('connected');
        if (res.activeUsers) {
          setActiveUsers(res.activeUsers);
        }
      } else {
        setSocketStatus('disconnected');
      }
    };

    const handleDisconnect = () => {
      setSocketStatus('disconnected');
    };

    const handleConnectError = () => {
      setSocketStatus('disconnected');
    };

    const handlePresenceUpdate = (data) => {
      if (data?.activeUsers) {
        setActiveUsers(data.activeUsers);
      }
    };

    const handleReceiveChanges = (data) => {
      if (!quillInstance || !data?.delta) return;
      quillInstance.updateContents(data.delta);
    };

    const handleReceiveTitleChange = (data) => {
      if (!data?.title) return;
      setDocument((prev) => ({ ...prev, title: data.title }));
      window.document.title = `${data.title} — CollabSpace Docs`;
      toast.info(`Title updated to "${data.title}" by collaborator`);
    };

    const handleSaveStatus = (data) => {
      if (data?.status === 'saving') {
        setSaveStatus('saving');
      } else if (data?.status === 'saved') {
        setSaveStatus('saved');
      } else if (data?.status === 'error') {
        setSaveStatus('error');
        toast.error('Collaborative save encountered an error');
      }
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('presence-update', handlePresenceUpdate);
    socket.on('receive-changes', handleReceiveChanges);
    socket.on('receive-title-change', handleReceiveTitleChange);
    socket.on('save-status', handleSaveStatus);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('presence-update', handlePresenceUpdate);
      socket.off('receive-changes', handleReceiveChanges);
      socket.off('receive-title-change', handleReceiveTitleChange);
      socket.off('save-status', handleSaveStatus);
      socketService.leaveDocument(id);
      setActiveUsers([]);
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

  // 4. Dual-Engine Save Function
  const performSave = useCallback(async () => {
    if (!quillInstance || userRole === 'viewer') return;

    setSaveStatus('saving');
    const contents = quillInstance.getContents();

    try {
      const rawSocket = socketService.getRawSocket();
      if (rawSocket && rawSocket.connected) {
        const res = await socketService.saveDocument(id, contents);
        if (res?.success) {
          setSaveStatus('saved');
          return;
        }
      }

      await docService.saveDocumentData(id, contents);
      setSaveStatus('saved');
    } catch (err) {
      console.error('[EditorPage] Failed to auto-save document:', err);
      setSaveStatus('error');
      toast.error('Save failed. Check your internet connection.');
    }
  }, [id, quillInstance, userRole]);

  // 5. Attach Quill 'text-change' listener
  useEffect(() => {
    if (!quillInstance || userRole === 'viewer') return;

    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== 'user' || isInitialLoadRef.current) return;

      socketService.sendChanges(id, delta);
      setSaveStatus('unsaved');

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

  // 6. Browser tab exit protection
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

  // 7. Inline Title Renaming Handler
  const handleRenameTitle = async (newTitle) => {
    try {
      const updated = await docService.updateDocumentTitle(id, newTitle);
      setDocument((prev) => ({ ...prev, title: updated.document.title }));
      window.document.title = `${updated.document.title} — CollabSpace Docs`;
      socketService.sendTitleChange(id, updated.document.title);
      toast.success(`Title updated to "${updated.document.title}"`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to rename title');
    }
  };

  // 8. Stable callback ref for TextEditor
  const handleEditorReady = useCallback((q) => {
    setQuillInstance(q);
  }, []);

  // Professional Skeleton Loading State
  if (isLoading) {
    return <EditorSkeleton />;
  }

  // Error Screen
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
      <EditorHeader
        document={document}
        userRole={userRole}
        activeUsers={activeUsers}
        currentUserId={currentUser?.id}
        saveStatus={saveStatus}
        socketStatus={socketStatus}
        onRenameTitle={handleRenameTitle}
        onRetrySave={performSave}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      <TextEditor
        onEditorReady={handleEditorReady}
        userRole={userRole}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={document}
        userRole={userRole}
      />
    </div>
  );
};