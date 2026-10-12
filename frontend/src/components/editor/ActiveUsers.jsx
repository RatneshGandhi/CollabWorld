import React, { useState, useRef, useEffect } from 'react';
import { Users, Crown, Shield, Eye } from 'lucide-react';

// Vibrant, accessible color palette for collaborator avatars (Google Docs inspired)
const AVATAR_PALETTE = [
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#0d9488', // Teal
];

const getUserColor = (user) => {
  if (user?.color?.hex) return user.color.hex;
  const id = typeof user?.userId === 'number' ? user.userId : String(user?.userId || '').charCodeAt(0) || 0;
  return AVATAR_PALETTE[Math.abs(id) % AVATAR_PALETTE.length];
};

export const ActiveUsers = ({ activeUsers = [], currentUserId }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  if (!activeUsers || activeUsers.length === 0) {
    return null;
  }

  // Display at most 4 avatars directly; collapse extra users into '+N'
  const visibleUsers = activeUsers.slice(0, 4);
  const hiddenCount = Math.max(0, activeUsers.length - 4);

  return (
    <div className="relative flex items-center" ref={containerRef}>
      {/* Overlapping Avatar Circles Container */}
      <div
        className="flex items-center -space-x-2 cursor-pointer select-none py-1"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        title="Active collaborators in this document"
      >
        {visibleUsers.map((user) => {
          const isSelf = user.userId === currentUserId;
          const initial = user.name?.trim().charAt(0).toUpperCase() || 'U';
          const bgColor = getUserColor(user);

          return (
            <div
              key={user.userId}
              className="group relative transition-transform hover:z-20 hover:scale-110 duration-150 flex-shrink-0"
            >
              {/* Avatar Circle with inline background color */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white shadow-xs uppercase select-none"
                style={{ backgroundColor: bgColor }}
              >
                {initial}
              </div>

              {/* Online Pulse Dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>

              {/* Hover Tooltip */}
              <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                <div className="bg-slate-900/95 backdrop-blur-xs text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap flex items-center gap-1.5 font-medium border border-slate-700/50">
                  <span className="font-semibold">{user.name}</span>
                  {isSelf && <span className="text-slate-400 font-normal">(you)</span>}
                  <span className="text-slate-500">•</span>
                  <span className="text-blue-300 capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Overflow '+N' Circle */}
        {hiddenCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-xs flex-shrink-0">
            +{hiddenCount}
          </div>
        )}
      </div>

      {/* Dropdown Popover on Click: Full Active Collaborators List */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50 text-xs animate-in fade-in duration-100">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Active Now ({activeUsers.length})
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
              ● Online
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {activeUsers.map((user) => {
              const isSelf = user.userId === currentUserId;
              const bgColor = getUserColor(user);
              const initial = user.name?.trim().charAt(0).toUpperCase() || 'U';

              return (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold ring-1 ring-white uppercase flex-shrink-0 shadow-2xs"
                      style={{ backgroundColor: bgColor }}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate leading-tight">
                        {user.name} {isSelf && <span className="font-normal text-slate-400">(you)</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${
                      user.role === 'owner'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : user.role === 'viewer'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {user.role === 'owner' ? (
                      <Crown className="w-2.5 h-2.5 text-amber-500" />
                    ) : user.role === 'viewer' ? (
                      <Eye className="w-2.5 h-2.5 text-amber-600" />
                    ) : (
                      <Shield className="w-2.5 h-2.5 text-emerald-600" />
                    )}
                    {user.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};