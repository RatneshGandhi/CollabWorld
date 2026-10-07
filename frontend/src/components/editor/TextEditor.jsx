import React, { useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { TOOLBAR_OPTIONS } from './toolbarOptions';

export const TextEditor = ({
  onEditorReady,
  userRole,
}) => {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const isViewer = userRole === 'viewer';

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    // Clean existing contents (prevents duplicate toolbars in React StrictMode)
    containerRef.current.innerHTML = '';

    const editor = document.createElement('div');
    containerRef.current.append(editor);

    const q = new Quill(editor, {
      theme: 'snow',
      modules: {
        toolbar: isViewer ? false : TOOLBAR_OPTIONS,
      },
      readOnly: isViewer,
      placeholder: isViewer
        ? 'This document is in read-only mode.'
        : 'Type your story, brainstorm ideas, or paste delta notes here...',
    });

    if (isViewer) {
      q.enable(false);
    }

    quillRef.current = q;

    if (onEditorReady) {
      onEditorReady(q);
    }
  }, []); // Run once on mount

  // Update read-only state if userRole changes
  useEffect(() => {
    if (!quillRef.current) return;
    if (isViewer) {
      quillRef.current.enable(false);
    } else {
      quillRef.current.enable(true);
    }
  }, [isViewer]);

  return (
    <div className="w-full flex-1 flex flex-col bg-slate-100">
      <div className="w-full flex flex-col flex-1" ref={containerRef}></div>
    </div>
  );
};