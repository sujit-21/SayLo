import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import NewChatModal from '../../components/chat/NewChatModal';
import NewGroupModal from '../../components/chat/NewGroupModal';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';

const ChatsPage = () => {
  const { conversationId, groupId } = useParams();
  const currentTargetId = conversationId || groupId;
  const { activeConversation, selectConversation, fetchConversations } = useChat();

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      api.post(`/conversations/join/${joinCode}`)
        .then(async (res) => {
          if (res.data.conversationId) {
            await fetchConversations();
            selectConversation(res.data.conversationId);
          }
        })
        .catch(console.error);
    }

    const startUser = params.get('start');
    if (startUser) {
      api.post('/conversations/direct', { recipientId: startUser })
        .then(async (res) => {
          if (res.data?.conversation) {
            await fetchConversations();
            selectConversation(res.data.conversation);
          }
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (currentTargetId && activeConversation?._id !== currentTargetId) {
      selectConversation(currentTargetId);
    }
  }, [currentTargetId]);

  return (
    <div className="flex-1 h-full flex overflow-hidden">
      {/* Conversation Sidebar (Hidden on mobile if a chat is active) */}
      <div className={`h-full ${activeConversation ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        <ConversationList
          onOpenNewChat={() => setShowNewChatModal(true)}
          onOpenNewGroup={() => setShowNewGroupModal(true)}
        />
      </div>

      {/* Main Chat Window (Full width on mobile when chat is active) */}
      <div className={`flex-1 h-full ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <ChatWindow />
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onOpenNewGroup={() => {
          setShowNewChatModal(false);
          setShowNewGroupModal(true);
        }}
      />

      <NewGroupModal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
      />
    </div>
  );
};

export default ChatsPage;

