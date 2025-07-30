# One-to-Many Video Conference App (React + Vite)


A frontend-only video conferencing application built with React, Vite, and WebRTC (PeerJS) that enables one-to-many broadcasting with manual signaling.

## Features

-  One broadcaster to multiple viewers
-  WebRTC peer-to-peer video/audio streaming
-  Manual peer ID exchange (no backend required)
-  Real-time connection status monitoring
- Responsive video grid layout
-  Copy-paste signaling for easy setup

## Tech Stack

-  [Vite](https://vitejs.dev/) - Next-gen frontend tooling
-  [React](https://reactjs.org/) - JavaScript library
-  [PeerJS](https://peerjs.com/) - WebRTC wrapper library
-  [styled-components](https://styled-components.com/) - CSS-in-JS
-  [react-copy-to-clipboard](https://www.npmjs.com/package/react-copy-to-clipboard) - Easy copy functionality


## Getting Started
npm  i
npm run dev

### Prerequisites

- Node.js (v14+ recommended)
- npm 
- Modern browser with WebRTC support (Chrome, Firefox, Edge)

How to Use

For Broadcasters (Host)
Click "Start Broadcasting", then share your ID with viewers.

Click "Hang Up" to end the broadcast when finished

For Viewers
Viewer: Paste the broadcaster's ID and click "Connect".