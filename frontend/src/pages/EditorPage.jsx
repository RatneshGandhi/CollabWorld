import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { docService } from '../services/docService';
import { EditorHeader } from '../components/editor/EditorHeader';
import { TextEditor } from '../components/editor/TextEditor';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [quillInstance, setQuillInstance] = useState(null);

  // 1. Fetch document on mount
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
    };
  }, [id]);

  // 2. Hydrate Quill with document Delta once BOTH Quill and Document are loaded
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
  }, [quillInstance, document?.id, userRole]);

  // Stable callback reference prevents child re-render loop
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
      {/* Top Header */}
      <EditorHeader
        document={document}
        userRole={userRole}
        onOpenShare={() => {
          alert('Share Modal will be connected on Day 12!');
        }}
      />

      {/* Editor Canvas */}
      <TextEditor
        onEditorReady={handleEditorReady}
        userRole={userRole}
      />
    </div>
  );
};