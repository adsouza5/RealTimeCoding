import { Editor } from 'slate';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Custom hook to add collaborative features
const withCollaboration = (editor) => {
  const { apply } = editor;

  editor.apply = (operation) => {
    apply(operation);

    // Send operation to other collaborators through socket
    socket.emit('editorOperation', operation);
  };

  // Listen for operations from other collaborators
  socket.on('editorOperation', (operation) => {
    editor.apply(operation);
  });

  return editor;
};

export default withCollaboration;
