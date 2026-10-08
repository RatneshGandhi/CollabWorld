import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { docService } from '../../services/docService';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  UserPlus,
  Shield,
  Crown,
  Trash2,
  Copy,
  Check,
  Loader2,
  Users,
  Eye,
  Edit3,
} from 'lucide-react';

export const ShareModal = ({
  isOpen,
  onClose,
  document,
  userRole,
}) => {
  const { user: currentUser } = useAuth();

  // Collaborators & Owner State
  const [owner, setOwner] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Invite Form State
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor'); // 'editor' | 'viewer'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Copy Link State
  const [hasCopied, setHasCopied] = useState(false);

  const isOwner = userRole === 'owner';

  // 1. Fetch collaborators when modal opens
  const fetchCollaborators = async () => {
    if (!document?.id) return;
    setIsLoadingList(true);
    setErrorMessage('');
    try {
      const data = await docService.getCollaborators(document.id);
      setOwner(data.owner);
      setCollaborators(data.collaborators || []);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to load collaborators'
      );
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
      setEmail('');
      setErrorMessage('');
      setSuccessMessage('');
      setHasCopied(false);
    }
  }, [isOpen, document?.id]);

  // 2. Invite Collaborator Handler
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const data = await docService.addCollaborator(document.id, {
        email: email.trim(),
        role,
      });

      // Update state: if collaborator already exists in list, update their role, else append
      setCollaborators((prev) => {
        const exists = prev.some((c) => c.userId === data.collaborator.userId);
        if (exists) {
          return prev.map((c) =>
            c.userId === data.collaborator.userId ? { ...c, role: data.collaborator.role } : c
          );
        }
        return [...prev, data.collaborator];
      });

      setSuccessMessage(`Invited ${data.collaborator.name || email} as ${data.collaborator.role}`);
      setEmail('');
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to invite collaborator'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Change Role of Existing Collaborator
  const handleRoleChange = async (collab, newRole) => {
    try {
      await docService.addCollaborator(document.id, {
        email: collab.email,
        role: newRole,
      });
      setCollaborators((prev) =>
        prev.map((c) => (c.userId === collab.userId ? { ...c, role: newRole } : c))
      );
      setSuccessMessage(`Updated ${collab.name}'s role to ${newRole}`);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to update collaborator role'
      );
    }
  };

  // 4. Remove Collaborator Handler
  const handleRemoveCollaborator = async (collabUserId, collabName) => {
    try {
      await docService.removeCollaborator(document.id, collabUserId);
      setCollaborators((prev) => prev.filter((c) => c.userId !== collabUserId));
      setSuccessMessage(`Removed ${collabName} from document`);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to remove collaborator'
      );
    }
  };

  // 5. Copy Link to Clipboard
  const handleCopyLink = () => {
    const docUrl = window.location.href;
    navigator.clipboard.writeText(docUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share "${document.title}"`}
      description="Invite teammates and manage granular view/edit access."
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Alerts */}
        {errorMessage && (
          <Alert
            variant="error"
            message={errorMessage}
            onClose={() => setErrorMessage('')}
          />
        )}
        {successMessage && (
          <Alert
            variant="success"
            message={successMessage}
            onClose={() => setSuccessMessage('')}
          />
        )}

        {/* 1. Invite Form (Only Document Owner can invite new people) */}
        {isOwner ? (
          <form onSubmit={handleInvite} className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Email Input */}
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@collabspace.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {/* Role Dropdown */}
              <div className="sm:w-28 flex-shrink-0">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs py-2.5 px-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium text-slate-700 cursor-pointer"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={!email.trim()}
                icon={UserPlus}
                className="flex-shrink-0"
              >
                Invite
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Editors can modify content & title. Viewers have read-only access.
            </p>
          </form>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>Only the document owner can invite new collaborators.</span>
          </div>
        )}

        <hr className="border-slate-100" />

        {/* 2. People with Access List */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            People with access ({1 + collaborators.length})
          </h4>

          {isLoadingList ? (
            <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading permissions...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {/* Document Owner Row */}
              {owner && (
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase flex-shrink-0 shadow-2xs">
                      {owner.name?.charAt(0) || 'O'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {owner.name} {owner.id === currentUser?.id && <span className="font-normal text-slate-500">(you)</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{owner.email}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    <Crown className="w-3 h-3 text-amber-500" /> Owner
                  </span>
                </div>
              )}

              {/* Collaborators Rows */}
              {collaborators.map((collab) => {
                const isSelf = collab.userId === currentUser?.id;
                return (
                  <div
                    key={collab.id || collab.userId}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                        {collab.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {collab.name} {isSelf && <span className="font-normal text-slate-500">(you)</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{collab.email}</p>
                      </div>
                    </div>

                    {/* Role selector & remove button */}
                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <select
                            value={collab.role}
                            onChange={(e) => handleRoleChange(collab, e.target.value)}
                            className="text-xs py-1 px-2 bg-white border border-slate-200 rounded-md font-medium text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveCollaborator(collab.userId, collab.name)}
                            title="Remove access"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold capitalize text-slate-600 px-2 py-1 bg-slate-100 rounded-md">
                          {collab.role}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {collaborators.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3 italic">
                  No other collaborators yet. Invite someone above!
                </p>
              )}
            </div>
          )}
        </div>

        {/* 3. Footer: Copy Link Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Link access restricted to authorized collaborators</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            icon={hasCopied ? Check : Copy}
            className={hasCopied ? 'text-emerald-600 border-emerald-300 bg-emerald-50' : ''}
          >
            {hasCopied ? 'Link Copied!' : 'Copy Link'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};