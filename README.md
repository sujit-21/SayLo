# SAYLO — Full-Stack Real-Time Messaging Platform

![SAYLO Logo](client/public/saylo-icon.svg)

**SAYLO** is a modern, responsive, full-stack real-time messaging web platform inspired by WhatsApp Web, built with original branding, a clean component design system, and an enterprise-grade architecture.

---

## 🌟 Key Highlights

- **Pure JavaScript Full-Stack:** Built entirely in JavaScript (JSX frontend + Node.js/Express backend). No TypeScript or Next.js.
- **WhatsApp Web Inspired UI:** Clean 3-pane layout (Navigation strip, Conversation list, and Active chat window) with light and dark themes, WhatsApp-style green accent (`#00a884`), rounded message bubbles, and smooth responsive transitions for desktop, tablet, and mobile.
- **Real-Time WebSockets:** Powered by Socket.IO for instant messaging, delivered/read receipts, typing indicators, online presence, live emoji reactions, and poll voting.
- **Peer-to-Peer Voice & Video Calls:** WebRTC implementation with public Google STUN fallback, call signaling, screen sharing, audio muting, camera toggling, and call history tracking.
- **Advanced Messaging Suite:**
  - ⏱️ **Disappearing Messages:** Configurable 24 hours, 7 days, 90 days, or off (with MongoDB TTL indexing).
  - 👁️ **View-Once Media:** Images that can be opened only once by the recipient.
  - 🎤 **Voice Notes Recorder:** In-browser audio recording (MediaRecorder API) with live duration counter and instant upload.
  - 📊 **Interactive Group Polls:** Real-time poll creation with single or multiple choice voting and live progress percentages.
  - 🔒 **Locked Chats:** Chat hiding protected by a 4-digit security PIN.
  - 🛡️ **Two-Step Verification:** Extra PIN layer on account login.
  - 📱 **Linked Devices:** Active session manager with QR-code pairing view and one-click remote session revocation.
  - ⭐ **Starred Messages & Archived Chats:** Bookmark key messages and keep chat lists organized.
  - 🎨 **Custom Themes & Wallpapers:** Dark/Light modes with customizable chat doodle and minimal backgrounds.
  - 📥 **Chat Transcript Export:** Download clean `.txt` chat history transcripts.
  - 👤 **Note to Self (Message Yourself):** Personal notepad for thoughts, reminders, and links.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v7, Tailwind CSS, Lucide React, Axios, date-fns |
| **Backend** | Node.js, Express.js, Socket.IO, Multer, Mongoose |
| **Database** | MongoDB (Local service or MongoDB Atlas) |
| **Real-Time** | Socket.IO WebSockets + WebRTC (RTCPeerConnection with STUN servers) |
| **Authentication** | JSON Web Tokens (JWT) & bcryptjs password hashing |
| **Storage** | Multer disk storage for local uploads (`/uploads`) with pluggable Cloudinary support |

---

## 📁 Project Structure

```text
saylo/
├── client/
│   ├── public/
│   │   └── saylo-icon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── calls/
│   │   │   │   └── CallOverlay.jsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatHeader.jsx
│   │   │   │   ├── ChatInfoPanel.jsx
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   ├── ConversationList.jsx
│   │   │   │   ├── DisappearingModal.jsx
│   │   │   │   ├── LockChatModal.jsx
│   │   │   │   ├── MessageInput.jsx
│   │   │   │   ├── MessageItem.jsx
│   │   │   │   ├── NewChatModal.jsx
│   │   │   │   ├── NewGroupModal.jsx
│   │   │   │   ├── NewPollModal.jsx
│   │   │   │   └── WallpaperModal.jsx
│   │   │   ├── common/
│   │   │   │   ├── Avatar.jsx
│   │   │   │   └── Modal.jsx
│   │   │   └── layout/
│   │   │       ├── AppLayout.jsx
│   │   │       └── NavigationSidebar.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CallContext.jsx
│   │   │   ├── ChatContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── ForgotPasswordPage.jsx
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   ├── ResetPasswordPage.jsx
│   │   │   │   └── VerifyAccountPage.jsx
│   │   │   ├── archived/
│   │   │   ├── calls/
│   │   │   ├── chats/
│   │   │   ├── communities/
│   │   │   ├── contacts/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   ├── starred/
│   │   │   ├── status/
│   │   │   └── NotFoundPage.jsx
│   │   ├── routes/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── callController.js
│   │   │   ├── channelController.js
│   │   │   ├── chatController.js
│   │   │   ├── communityController.js
│   │   │   ├── messageController.js
│   │   │   ├── statusController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── uploadMiddleware.js
│   │   ├── models/
│   │   │   ├── Call.js
│   │   │   ├── Channel.js
│   │   │   ├── Community.js
│   │   │   ├── Conversation.js
│   │   │   ├── DeviceSession.js
│   │   │   ├── Message.js
│   │   │   ├── Status.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   ├── sockets/
│   │   │   └── socketHandler.js
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   └── seed.js
│   │   ├── app.js
│   │   └── server.js
│   ├── uploads/
│   ├── .env
│   ├── .env.example
│   └── package.json
├── tests/
│   └── api_verification.js
├── package.json
└── README.md
```

---

## ⚡ Installation & Quick Start

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **MongoDB** running locally on port 27017 or a MongoDB Atlas URI

### 2. Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/saylo.git
cd saylo

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Install root runner dependencies
cd ..
npm install
```

### 3. Environment Configuration
Create or edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/saylo
JWT_SECRET=saylo_super_secret_jwt_key_2026_secured_production_grade
CLIENT_URL=http://localhost:5173
NODE_ENV=development
UPLOAD_DIR=uploads
```

### 4. Seed Demo Accounts & Data
Run the database seed script to populate sample contacts, conversations, polls, channels, and status stories:
```bash
npm run seed
```

#### Demo Test Accounts:
| User | Email | Password |
|---|---|---|
| **Alice Morgan** | `alice@saylo.com` | `password123` |
| **Bob Miller** | `bob@saylo.com` | `password123` |
| **Charlie Davis** | `charlie@saylo.com` | `password123` |

*(Fast 1-click login buttons are also provided on the `/login` screen).*

### 5. Start Application

#### Development Mode (Concurrently):
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API & WebSockets: `http://localhost:5000`

#### Production Build & Run:
```bash
# Build frontend
npm run build

# Start backend server (serves API, WebSockets, and frontend production build on port 5000)
cd server
npm start
```
Open `http://localhost:5000` in your browser.

---

## 🧪 Automated Testing

Execute the end-to-end verification suite:
```bash
node tests/api_verification.js
```
This script tests:
1. Multi-user login & JWT authorization
2. Direct 1-on-1 and Note to Self conversation retrieval
3. Real-time message sending & persistence
4. Recipient message retrieval & unread counts
5. Emoji reactions update
6. Starred message toggling
7. 24-hour Status Story creation & contact viewer tracking
8. WebRTC Audio & Video call logging

---

## 🔌 API Documentation (`/api/v1`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Register new user account |
| `/api/v1/auth/login` | POST | Login and receive JWT & device session |
| `/api/v1/auth/me` | GET | Retrieve authenticated user profile |
| `/api/v1/auth/profile` | PUT | Update name, about, avatar, phone, wallpaper |
| `/api/v1/auth/two-factor` | POST | Enable/disable two-factor PIN |
| `/api/v1/auth/privacy` | PUT | Update Last Seen, Avatar, and Read Receipts privacy |
| `/api/v1/conversations` | GET | List user conversations with last message previews |
| `/api/v1/conversations/direct` | POST | Create or get 1-on-1 direct chat |
| `/api/v1/conversations/group` | POST | Create group chat with admins and participants |
| `/api/v1/conversations/note-to-self` | POST | Get or create personal note-to-self chat |
| `/api/v1/messages/:conversationId` | GET | Paginated messages for a conversation |
| `/api/v1/messages` | POST | Send text, media, poll, event, or location message |
| `/api/v1/messages/:id/react` | POST | React to message with emoji |
| `/api/v1/messages/:id/star` | POST | Star or unstar a message |
| `/api/v1/messages/:id/delete` | POST | Delete for me or delete for everyone |
| `/api/v1/messages/:id/poll/vote` | POST | Vote on a poll option |
| `/api/v1/messages/:id/view-once` | POST | Open and reveal view-once media |
| `/api/v1/status` | GET/POST | Fetch contact status updates or post new status |
| `/api/v1/calls` | GET/POST | Call history log and WebRTC call record |
| `/api/v1/upload` | POST | Multipart file upload for media, voice notes, and docs |

---

## 🔒 Security & Privacy Practices

- **Password Safety:** Passwords are encrypted using salted bcrypt hashing (`salt=10`). Plaintext passwords are never stored or logged.
- **Strict Authorization:** Server validates conversation membership on every message and query. Users can never view or manipulate chats they do not belong to.
- **View-Once Media Guarantee:** View-once items are strictly marked in the database once opened; subsequent requests are rejected.
- **Server File Validation:** Multer upload limits enforce size and mime-type verification. Client-supplied extensions are sanitized.

---

## 📄 License
MIT License. Built for the SAYLO Real-Time Messaging Platform.

