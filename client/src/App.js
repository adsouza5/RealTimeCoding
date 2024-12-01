import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import io from 'socket.io-client';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './App.css';

const socket = io('http://localhost:5000');

const App = () => {
  const [code, setCode] = useState('// Start coding...');
  const [documentId] = useState('default');
  const [loading, setLoading] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);

  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  let localStream = useRef(null);
  let screenStream = useRef(null);

  // Load initial code from Firestore
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const docRef = doc(db, 'sessions', documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedCode = docSnap.data().content;
          setCode(fetchedCode || '// Start coding...');
        } else {
          setCode('// Start coding...');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        setCode('// Error loading code');
      }
      setLoading(false);
    };

    fetchDocument();

    // Listen for code updates from other collaborators via socket
    socket.on('codeUpdate', (newCode) => {
      setCode(newCode);
    });

    return () => {
      socket.off('codeUpdate');
    };
  }, [documentId]);

  // Handle changes in the editor
  const handleEditorChange = (newValue) => {
    setCode(newValue);
    socket.emit('codeChange', newValue);

    // Save code to Firestore
    const docRef = doc(db, 'sessions', documentId);
    setDoc(docRef, { content: newValue })
      .then(() => console.log('Document saved successfully!'))
      .catch((error) => console.error('Error saving document:', error));
  };

  // Toggle camera on/off
  const toggleCamera = async () => {
    if (!isCameraOn) {
      try {
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        localVideoRef.current.srcObject = localStream.current;
        setIsCameraOn(true);
      } catch (err) {
        console.error('Error accessing the camera:', err);
      }
    } else {
      localStream.current.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  // Toggle microphone on/off
  const toggleMicrophone = async () => {
    if (!isMicOn) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        // If microphone access is successful, integrate it with your existing stream
        localStream.current = audioStream;
        setIsMicOn(true);
      } catch (err) {
        console.error('Error accessing the microphone:', err);
      }
    } else {
      localStream.current.getTracks().forEach(track => track.stop());
      setIsMicOn(false);
    }
  };

  // Toggle screen sharing on/off
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        screenStream.current = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenVideoRef.current.srcObject = screenStream.current;

        screenStream.current.getTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenVideoRef.current.srcObject = null;
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error sharing the screen:', err);
      }
    } else {
      screenStream.current.getTracks().forEach(track => track.stop());
      screenVideoRef.current.srcObject = null;
      setIsScreenSharing(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {/* Monaco Editor */}
      <div className="editor-container">
        <Editor
          height="60vh"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{ automaticLayout: true }}
        />
      </div>

      {/* Video and Screen Sharing Controls */}
      <div className="overlay">
        <div className="video-container">
          <div className="facecam-container">
            <video
              className="video-local"
              ref={localVideoRef}
              autoPlay
              muted
            ></video> {/* Placeholder for local video */}
          </div>
          <video
            className="video-remote"
            ref={screenVideoRef}
            autoPlay
          ></video> {/* Placeholder for screen share */}
        </div>

        <div className="controls">
          <button onClick={toggleScreenShare}>
            {isScreenSharing ? 'Stop Screen Share' : 'Start Screen Share'}
          </button>
          <button onClick={toggleCamera}>
            {isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
          </button>
          <button onClick={toggleMicrophone}>
            {isMicOn ? 'Turn Microphone Off' : 'Turn Microphone On'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
