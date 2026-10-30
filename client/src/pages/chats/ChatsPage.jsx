import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import NewChatModal from '../../components/chat/NewChatModal';
import NewGroupModal from '../../components/chat/NewGroupModal';
import { useChat } from '../../context/ChatContext';

const ChatsPage = () => {
  const { conversationId } = useParams();
  const { activeConversation, selectConversation } = useChat();

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);

  useEffect(() => {
    if (conversationId && (!activeConversation || activeConversation._id !== conversationId)) {
      selectConversation(conversationId);
    }
  }, [conversationId, activeConversation, selectConversation]);

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
