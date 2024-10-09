import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import io from 'socket.io-client';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import withCollaboration from './withCollaboration'; // Import the custom hook
import './App.css';  // Import custom styles

const socket = io('http://localhost:5000');

const App = () => {
  const [editor] = useState(() => withCollaboration(withHistory(withReact(createEditor()))));
  const [documentId] = useState('default'); // Default document ID
  const [loading, setLoading] = useState(true);
  
  // Default initial value for the Slate editor
  const initialValue = useMemo(() => [
    {
      type: 'paragraph',
      children: [{ text: 'Start writing your collaborative document here...' }],
    },
  ], []);

  const [editorValue, setEditorValue] = useState(initialValue); // Initialize with initialValue

  // Load the initial document from Firestore on mount
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const docRef = doc(db, 'sessions', documentId);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const fetchedContent = docSnap.data().content;
          if (fetchedContent) {
            const parsedContent = JSON.parse(fetchedContent);
            if (Array.isArray(parsedContent)) {
              setEditorValue(parsedContent); // Ensure valid content
            } else {
              console.warn('Invalid content fetched, using initialValue.');
              setEditorValue(initialValue); // Fallback to initialValue
            }
          } else {
            console.log("No content available, initializing with default.");
            setEditorValue(initialValue);
          }
        } else {
          console.warn('No document found, initializing with default content.');
          setEditorValue(initialValue);
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        setEditorValue(initialValue); // Fallback on error
      }
  
      setLoading(false); // Ensure loading state is updated after fetching
    };
  
    fetchDocument();
  
    // Listen for updates from other collaborators via socket
    socket.on('documentUpdate', (newContent) => {
      try {
        const parsedContent = JSON.parse(newContent);
        if (Array.isArray(parsedContent)) {
          setEditorValue(parsedContent);
        } else {
          console.warn('Invalid socket update, ignoring.');
        }
      } catch (e) {
        console.error('Failed to parse documentUpdate:', e);
      }
    });
  
    return () => {
      socket.off('documentUpdate');
    };
  }, [documentId, initialValue]);

  // Handle change in editor content
  const handleChange = (value) => {
    setEditorValue(value); // Update the local editor value
    const content = JSON.stringify(value);
    socket.emit('documentChange', content); // Send updated content via socket

    // Save the document to Firebase Firestore
    const docRef = doc(db, 'sessions', documentId);
    setDoc(docRef, { content })
      .then(() => console.log('Document saved successfully!'))
      .catch((error) => console.error('Error saving document:', error));
  };

  // Custom rendering for formatting (e.g., bold, italic, etc.)
  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />;
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <Slate 
        editor={editor} 
        value={editorValue.length > 0 ? editorValue : initialValue} // Ensure it's never undefined
        onChange={handleChange}
      >
        <Editable
          renderLeaf={renderLeaf}
          placeholder="Collaborative Document Editor"
          spellCheck
          autoFocus
        />
      </Slate>
    </div>
  );
};

// Define custom render leaf for styling like bold, italic, etc.
const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

export default App;
