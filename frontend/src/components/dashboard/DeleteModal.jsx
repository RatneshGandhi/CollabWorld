import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Trash2, AlertTriangle } from 'lucide-react';

export const DeleteModal = ({
  isOpen,
  onClose,
  document,
  onConfirmDelete,
  isLoading,
}) => {
  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Document"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Warning:</span> This action is permanent. Deleting{' '}
            <span className="font-semibold underline">"{document.title}"</span> will revoke access for all collaborators and permanently purge all rich text revisions.
          </div>
        </div>

        <p className="text-sm text-slate-600">
          Are you sure you want to proceed with deleting this document?
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            isLoading={isLoading}
            onClick={() => onConfirmDelete(document.id)}
            icon={Trash2}
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
};