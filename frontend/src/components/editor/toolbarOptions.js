/**
 * Complete Google Docs Rich Text Formatting Options
 */
export const TOOLBAR_OPTIONS = [
  // Heading & Size controls
  [{ header: [1, 2, 3, false] }],
  [{ font: [] }],

  // Inline formatting
  ['bold', 'italic', 'underline', 'strike'],

  // Colors: Text and Background
  [{ color: [] }, { background: [] }],

  // Lists & Indentation
  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
  [{ indent: '-1' }, { indent: '+1' }],

  // Alignment
  [{ align: [] }],

  // Rich blocks: Code block, Blockquote, Links
  ['blockquote', 'code-block'],
  ['link'],

  // Clean / Clear formatting
  ['clean'],
];