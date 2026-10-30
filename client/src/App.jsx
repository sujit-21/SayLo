import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { ThemeProvider } from './context/ThemeContext';

// Route Guards
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';

// Layout
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyAccountPage from './pages/auth/VerifyAccountPage';

// Main App Pages
import ChatsPage from './pages/chats/ChatsPage';
import ContactsPage from './pages/contacts/ContactsPage';
import StatusPage from './pages/status/StatusPage';
import CallsPage from './pages/calls/CallsPage';
import CommunitiesPage from './pages/communities/CommunitiesPage';
import StarredPage from './pages/starred/StarredPage';
import ArchivedPage from './pages/archived/ArchivedPage';

// Settings & Profile Pages
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import AccountSettings from './pages/settings/AccountSettings';
import PrivacySettings from './pages/settings/PrivacySettings';
import SecuritySettings from './pages/settings/SecuritySettings';
import NotificationSettings from './pages/settings/NotificationSettings';
import AppearanceSettings from './pages/settings/AppearanceSettings';
import StorageSettings from './pages/settings/StorageSettings';
import ChatSettings from './pages/settings/ChatSettings';

// Not Found
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <CallProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Authentication Routes */}
                  <Route element={<PublicRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                  </Route>

                  {/* Account Verification Route */}
                  <Route path="/verify-account" element={<VerifyAccountPage />} />

                  {/* Protected Main Application Shell */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<Navigate to="/chats" replace />} />
                      <Route path="/chats" element={<ChatsPage />} />
                      <Route path="/chats/:conversationId" element={<ChatsPage />} />
                      <Route path="/groups/:groupId" element={<ChatsPage />} />
                      <Route path="/contacts" element={<ContactsPage />} />
                      <Route path="/status" element={<StatusPage />} />
                      <Route path="/calls" element={<CallsPage />} />
                      <Route path="/communities" element={<CommunitiesPage />} />
                      <Route path="/starred" element={<StarredPage />} />
                      <Route path="/archived" element={<ArchivedPage />} />

                      {/* Profile & Settings */}
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/settings/account" element={<AccountSettings />} />
                      <Route path="/settings/privacy" element={<PrivacySettings />} />
                      <Route path="/settings/security" element={<SecuritySettings />} />
                      <Route path="/settings/notifications" element={<NotificationSettings />} />
                      <Route path="/settings/appearance" element={<AppearanceSettings />} />
                      <Route path="/settings/chats" element={<ChatSettings />} />
                      <Route path="/settings/storage" element={<StorageSettings />} />
                    </Route>
                  </Route>

                  {/* 404 Catch All */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </BrowserRouter>
            </CallProvider>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

