import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Edit3 } from 'lucide-react';

export const RenameModal = ({
  isOpen,
  onClose,
  document,
  onRename,
  isLoading,
}) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
    }
  }, [document]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onRename(document.id, title.trim());
  };

  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Document"
      description="Enter a new title for this document."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Document Title"
          name="title"
          required
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Q4 Architecture Strategy"
        />

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
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={!title.trim() || title === document.title}
            icon={Edit3}
          >
            Rename
          </Button>
        </div>
      </form>
    </Modal>
  );
};