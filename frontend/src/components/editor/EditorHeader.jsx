import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Share2,
  ShieldCheck,
  Eye,
  Edit3,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const EditorHeader = ({
  document,
  userRole,
  saveStatus = 'saved', // 'saving' | 'saved' | 'unsaved'
  onOpenShare,
}) => {
  const navigate = useNavigate();

  const isOwner = userRole === 'owner';
  const isViewer = userRole === 'viewer';

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Back Navigation & Document Meta */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
          <FileText className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {document?.title || 'Untitled Document'}
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
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

          {/* Save Status Hint */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Saved to Cloud
            </span>
            {isViewer && (
              <>
                <span>•</span>
                <span className="text-amber-600 font-medium">Read-Only Mode</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Share Button (Only Owner or Editor) */}
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