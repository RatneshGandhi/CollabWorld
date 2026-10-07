import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { docService } from '../services/docService';
import { ArrowLeft, FileText, Loader2, Shield } from 'lucide-react';

export const EditorPlaceholder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const data = await docService.getDocumentById(id);
        setDocument(data.document);
        setUserRole(data.userRole);
      } catch (err) {
        setErrorMessage(
          err?.response?.data?.message || 'Could not load document.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Opening document...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center max-w-md">
          <h2 className="text-lg font-bold text-red-600 mb-2">Access Denied / Error</h2>
          <p className="text-sm text-slate-600 mb-4">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Editor Top Bar */}
      <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {document.title}
            </h1>
            <p className="text-xs text-slate-400">
              Role: <span className="capitalize font-semibold text-blue-600">{userRole}</span> • Ready for Day 10 Editor Integration
            </p>
          </div>
        </div>
      </header>

      {/* Faux Google Docs White Canvas Container */}
      <main className="flex-1 py-10 px-4 flex justify-center">
        <div className="w-full max-w-[816px] min-h-[1056px] bg-white rounded-sm shadow-lg border border-slate-200 p-12 sm:p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {document.title}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Document ID: <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">{document.id}</code>
          </p>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 max-w-sm">
            🎯 <strong>Day 9 Complete!</strong> Tomorrow on <strong>Day 10</strong>, we embed the full Quill.js rich text toolbar and Google Docs canvas right here!
          </div>
        </div>
      </main>
    </div>
  );
};