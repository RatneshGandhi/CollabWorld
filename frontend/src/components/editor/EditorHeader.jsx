import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Share2,
  Eye,
  Edit3,
  CloudCheck,
  Cloud,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const EditorHeader = ({
  document,
  userRole,
  saveStatus = 'saved', // 'saving' | 'saved' | 'unsaved' | 'error'
  onRenameTitle,
  onRetrySave,
  onOpenShare,
}) => {
  const navigate = useNavigate();
  const isOwner = userRole === 'owner';
  const isViewer = userRole === 'viewer';

  // Inline Title Editing State
  const [title, setTitle] = useState(document?.title || 'Untitled Document');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const inputRef = useRef(null);

  // Sync internal title state when document loads
  useEffect(() => {
    if (document?.title) {
      setTitle(document.title);
    }
  }, [document?.title]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== document?.title) {
      onRenameTitle(trimmed);
    } else {
      setTitle(document?.title || 'Untitled Document');
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitle(document?.title || 'Untitled Document');
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Back Arrow, Brand Icon & Inline Editable Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
          <FileText className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {/* Inline Title Field */}
            {isViewer ? (
              <h1 className="text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {document?.title || 'Untitled Document'}
              </h1>
            ) : isEditingTitle ? (
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleTitleKeyDown}
                className="text-base font-bold text-slate-900 bg-white border border-blue-500 rounded px-1.5 py-0.5 outline-none ring-2 ring-blue-100 max-w-xs sm:max-w-md"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename"
                className="text-base font-bold text-slate-900 hover:bg-slate-100 px-1.5 py-0.5 rounded transition-colors truncate max-w-xs sm:max-w-md text-left cursor-text border border-transparent hover:border-slate-300"
              >
                {document?.title || 'Untitled Document'}
              </button>
            )}

            {/* Role Badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 flex-shrink-0 ${
                isOwner
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : isViewer
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isViewer ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
              {userRole}
            </span>
          </div>

          {/* Dynamic Save Status Indicator */}
          <div className="flex items-center gap-2 text-xs">
            {isViewer ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Read-Only Mode
              </span>
            ) : saveStatus === 'saving' ? (
              <span className="text-blue-600 font-medium flex items-center gap-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            ) : saveStatus === 'unsaved' ? (
              <span className="text-amber-600 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block"></span>
                Unsaved changes
              </span>
            ) : saveStatus === 'error' ? (
              <button
                type="button"
                onClick={onRetrySave}
                className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer hover:underline"
                title="Click to retry saving"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Save failed — Click to retry
              </button>
            ) : (
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Saved to Cloud
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {!isViewer && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenShare}
            icon={Share2}
            className="border-slate-300 hover:border-blue-500 hover:text-blue-600 shadow-2xs"
          >
            Share
          </Button>
        )}
      </div>
    </header>
  );
};