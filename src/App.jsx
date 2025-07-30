import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { FaCopy, FaPhone, FaPhoneSlash, FaUserAlt } from 'react-icons/fa';
import Peer from 'peerjs';
import { useBroadcastChannel } from './useBroadcastChannel';

function App() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [peers, setPeers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [deviceStatus, setDeviceStatus] = useState({
    video: null,
    audio: null
  });
  
  const localVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const remoteStreams = useRef([]);

  useEffect(() => {
    const checkDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(track => track.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        setDeviceStatus({
          video: devices.some(d => d.kind === 'videoinput' && d.deviceId),
          audio: devices.some(d => d.kind === 'audioinput' && d.deviceId)
        });
      } catch (err) {
        console.error('Device check failed:', err);
        setDeviceStatus({ video: false, audio: false });
      }
    };

    checkDevices();
  }, []);

  useEffect(() => {
    const peer = new Peer();
    
    peer.on('open', (id) => {
      setPeerId(id);
    });

    peer.on('call', (call) => {
      if (isBroadcasting && localVideoRef.current?.srcObject) {
        call.answer(localVideoRef.current.srcObject);
        addPeer(call.peer);
        
        call.on('close', () => {
          removePeer(call.peer);
        });
      }
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      setConnectionStatus('Error: ' + err.type);
    });

    peerInstance.current = peer;

    return () => {
      peer.destroy();
    };
  }, [isBroadcasting]);

  const { postMessage } = useBroadcastChannel({
    onMessage: (message) => {
      if (message.type === 'PEER_ID' && !isBroadcasting) {
        setRemotePeerId(message.data);
      }
    }
  });

  useEffect(() => {
    if (peerId && isBroadcasting) {
      postMessage({ type: 'PEER_ID', data: peerId });
    }
  }, [peerId, isBroadcasting, postMessage]);

  const startBroadcasting = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      }).catch(err => {
        console.error('Media device error:', err);
        setConnectionStatus(`Error: ${err.message}`);
        
        if (err.name === 'NotFoundError') {
          alert('No camera/microphone found. Please connect a device and try again.');
        } else if (err.name === 'NotAllowedError') {
          alert('Permission denied. Please allow camera/microphone access.');
        }
        throw err;
      });

      localVideoRef.current.srcObject = stream;
      setIsBroadcasting(true);
      setIsViewing(false);
      setConnectionStatus('Ready to connect');
    } catch (err) {
      console.error('Broadcast failed:', err);
      setIsBroadcasting(false);
    }
  };

  const connectToBroadcaster = async () => {
    if (!remotePeerId) return;
    
    setIsViewing(true);
    setConnectionStatus('Connecting...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      
      const call = peerInstance.current.call(remotePeerId, stream);
      
      call.on('stream', (remoteStream) => {
        remoteStreams.current.push(remoteStream);
        setConnectionStatus('Connected');
      });
      
      call.on('close', () => {
        setConnectionStatus('Disconnected');
        remoteStreams.current = [];
      });
      
      call.on('error', (err) => {
        console.error('Call error:', err);
        setConnectionStatus('Error: ' + err);
      });
    } catch (err) {
      console.error('Failed to connect', err);
      setConnectionStatus('Error: ' + err.message);
    }
  };

  const hangUp = () => {
    if (peerInstance.current) {
      peerInstance.current.destroy();
      const newPeer = new Peer(peerId);
      peerInstance.current = newPeer;
    }
    
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    
    setIsBroadcasting(false);
    setIsViewing(false);
    setConnectionStatus('Disconnected');
    setPeers([]);
    remoteStreams.current = [];
  };

  const addPeer = (peerId) => {
    setPeers(prevPeers => [...prevPeers, peerId]);
  };

  const removePeer = (peerId) => {
    setPeers(prevPeers => prevPeers.filter(id => id !== peerId));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(peerId);
  };

  const getStatusClass = () => {
    if (connectionStatus === 'Connected') return 'connected';
    if (connectionStatus === 'Connecting...') return 'connecting';
    if (connectionStatus.includes('Error')) return 'error';
    return 'disconnected';
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Video Conference App</h1>
        <div className={`connection-status ${getStatusClass()}`}>
          {connectionStatus}
        </div>
      </header>
      
      <div className="video-container">
        <div className="video-box">
          <h3 className="id-label">{isBroadcasting ? 'Your Broadcast' : 'Your Video'}</h3>
          <video className="video-element" ref={localVideoRef} autoPlay muted />
        </div>
        
        {isBroadcasting && peers.map((peer, index) => (
          <div className="video-box" key={index}>
            <h3>Viewer {index + 1}</h3>
            <video className="video-element" autoPlay />
            <div className="peer-status">Connected</div>
          </div>
        ))}
        
        {isViewing && remoteStreams.current.map((stream, index) => (
          <div className="video-box" key={index}>
            <h3>Broadcaster</h3>
            <video 
              className="video-element"
              autoPlay 
              ref={video => {
                if (video) video.srcObject = stream;
              }} 
            />
          </div>
        ))}
      </div>
      
      <div className="controls">
        <div className="device-status">
          <span>Camera: {deviceStatus.video === null ? '🔍 Checking...' : deviceStatus.video ? 'ON' : 'OFF'}</span>
          <span>Microphone: {deviceStatus.audio === null ? '🔍 Checking...' : deviceStatus.audio ? 'ON' : 'OFF'}</span>
        </div>
        
        {!isBroadcasting && !isViewing && (
          <button 
            className={`btn ${deviceStatus.video ? 'btn-primary' : 'btn-default'}`}
            onClick={startBroadcasting} 
            disabled={isBroadcasting || isViewing || deviceStatus.video === false || deviceStatus.video === null}
          >
            <FaUserAlt /> 
            {deviceStatus.video === null ? 'Checking devices...' : 'Start Broadcasting'}
          </button>
        )}
        
        {deviceStatus.video === false && (
          <small style={{color: 'red', display: 'block', marginTop: '10px'}}>
            No camera detected. Please connect one and refresh the page.
          </small>
        )}
        
        <div className="connection-data">
          <div>
            <label  className="id-label">Your ID:</label>
            <input className="input-field" value={peerId} readOnly />
            <button className="btn btn-default" onClick={copyToClipboard}>
              <FaCopy /> Copy
            </button>
          </div>
          
          <div>
            <label className="id-label ">Connect to Broadcaster ID:</label>
            <input 
              className="input-field"
              value={remotePeerId}
              onChange={(e) => setRemotePeerId(e.target.value)}
              placeholder="Enter broadcaster's ID"
            />
            {!isBroadcasting && (
              <button 
                className="btn btn-primary"
                onClick={connectToBroadcaster} 
                disabled={!remotePeerId || isViewing}
              >
                <FaPhone /> Connect
              </button>
            )}
          </div>
        </div>
        
        {(isBroadcasting || isViewing) && (
          <button className="btn btn-danger" onClick={hangUp}>
            <FaPhoneSlash /> Hang Up
          </button>
        )}
      </div>
      
      <div className="instructions">
        <h3>How to use:</h3>
        <p><strong>Broadcaster:</strong> Click "Start Broadcasting", then share your ID with viewers.</p>
        <p><strong>Viewer:</strong> Paste the broadcaster's ID and click "Connect".</p>
      </div>
    </div>
  );
}

export default App;