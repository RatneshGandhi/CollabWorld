import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Share2,
  Clock,
} from 'lucide-react';

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const DocumentCard = ({
  document,
  onOpenRename,
  onOpenDelete,
  onOpenShare,
  viewMode = 'grid',
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isOwner = document.userRole === 'owner';
  const isViewer = document.userRole === 'viewer';

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  const handleOpenDoc = () => {
    navigate(`/document/${document.id}`);
  };

  // List View Rendering
  if (viewMode === 'list') {
    return (
      <div className="group flex items-center justify-between p-3.5 sm:px-5 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all duration-150">
        <div
          onClick={handleOpenDoc}
          className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
              {document.title}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>{formatRelativeTime(document.updatedAt)}</span>
              <span>•</span>
              <span className="capitalize">{document.userRole}</span>
            </p>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 text-xs">
              <button
                type="button"
                onClick={handleOpenDoc}
                className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                Open
              </button>

              {!isViewer && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenShare(document);
                    }}
                    className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenRename(document);
                    }}
                    className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    Rename
                  </button>
                </>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenDelete(document);
                  }}
                  className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer border-t border-slate-100 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid View Rendering
  return (
    <div className="group relative bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Document Canvas Preview Thumbnail */}
      <div
        onClick={handleOpenDoc}
        className="w-full aspect-[16/10] bg-slate-50 border-b border-slate-100 p-5 flex flex-col justify-between cursor-pointer group-hover:bg-blue-50/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
          <FileText className="w-4 h-4" />
        </div>

        <div className="space-y-1.5 opacity-40 group-hover:opacity-70 transition-opacity">
          <div className="h-1.5 bg-slate-300 rounded w-3/4"></div>
          <div className="h-1.5 bg-slate-300 rounded w-full"></div>
          <div className="h-1.5 bg-slate-300 rounded w-5/6"></div>
          <div className="h-1.5 bg-slate-300 rounded w-1/2"></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(document.updatedAt)}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isOwner
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {document.userRole}
          </span>
        </div>
      </div>

      {/* Card Footer Details */}
      <div className="p-4 flex items-center justify-between gap-2">
        <div onClick={handleOpenDoc} className="min-w-0 flex-1 cursor-pointer">
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {document.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isOwner ? 'Owned by you' : 'Shared document'}
          </p>
        </div>

        {/* Actions Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-20 text-xs animate-in fade-in duration-100">
              <button
                type="button"
                onClick={handleOpenDoc}
                className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                Open
              </button>

              {!isViewer && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenShare(document);
                    }}
                    className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenRename(document);
                    }}
                    className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    Rename
                  </button>
                </>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenDelete(document);
                  }}
                  className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer border-t border-slate-100 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};