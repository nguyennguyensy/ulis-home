import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, User } from 'lucide-react';
import chatService from '../../services/chatService';
import authService from '../../services/authService';

const ChatBox = ({ currentUser, draftTargetId = null, onMessagesRead = null }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Guard: ensure currentUser exists before accessing properties
    if (!currentUser?.id) return;

    // TEMPORARILY DISABLED: Realtime subscription to save Firebase quota
    // TO RE-ENABLE: Uncomment the block below after upgrading to Blaze plan
    
    // Initial load only
    loadConversations();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    // If a draft target is provided, and there is no existing conversation, open a draft chat
    if (!currentUser || !draftTargetId) return;

    // If conversations already loaded, try to select existing conv or create draft
  const convWithTarget = conversations.find(conv => Array.isArray(conv.participants) && conv.participants.includes(draftTargetId));
    if (convWithTarget) {
      setSelectedConversation(convWithTarget);
      return;
    }

    // No existing conversation: create a temporary draft conversation object
    const tempConv = {
      id: null,
      participants: [currentUser.id, draftTargetId].sort(),
      messages: []
    };
    setSelectedConversation(tempConv);
    // ensure we have target user info
    (async () => {
      if (!usersMap[draftTargetId]) {
        const user = await authService.getUser(draftTargetId);
        setUsersMap(prev => ({ ...prev, [draftTargetId]: user }));
      }
    })();
  }, [draftTargetId, conversations, currentUser, usersMap]);

  useEffect(() => {
    // Only subscribe to a conversation when it has a valid id
    if (selectedConversation && selectedConversation.id) {
      loadConversationRealtime(selectedConversation.id);
      markMessagesAsRead();
    } else {
      // if selectedConversation has no id (draft), ensure no realtime listener is active
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]); // Only re-run when conversation ID changes, not the whole object

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const loadConversations = async () => {
    const userConversations = await chatService.getUserConversations(currentUser.id);
    console.log('📥 Raw conversations from API:', userConversations.length);
    // sanitize conversations: ensure participants and messages are arrays, filter out invalid ones
    const sanitized = userConversations
      .filter(conv => {
        if (!conv || !conv.id) {
          console.warn('⚠️ Filtering out invalid conversation:', conv);
          return false;
        }
        return true;
      })
      .map(conv => ({
        ...conv,
        participants: Array.isArray(conv.participants) ? conv.participants : [],
        messages: Array.isArray(conv.messages) ? conv.messages : []
      }));
    console.log('✅ Sanitized conversations:', sanitized.length);
    
    // Log unread messages per conversation
    sanitized.forEach(conv => {
      const unread = (conv.messages || []).filter(
        msg => msg.senderId !== currentUser.id && 
               (!msg.readBy || !msg.readBy.includes(currentUser.id))
      );
      if (unread.length > 0) {
        console.log(`📬 Conversation ${conv.id}: ${unread.length} unread messages`);
      }
    });
    
    setConversations(sanitized);

    // Load user info for all conversations
    const users = {};
    for (const conv of userConversations) {
      for (const participantId of conv.participants) {
        if (participantId !== currentUser.id && !users[participantId]) {
          const user = await authService.getUser(participantId);
          if (user) {
            users[participantId] = user;
          }
        }
      }
    }
    setUsersMap(users);

    // Select first conversation if exists
    if (userConversations.length > 0 && !selectedConversation) {
      setSelectedConversation(userConversations[0]);
    }
  };

  const loadConversationRealtime = (conversationId) => {
    // Unsubscribe from previous conversation
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to new conversation
    unsubscribeRef.current = chatService.subscribeToConversation(
      conversationId,
      (updatedConversation) => {
        setSelectedConversation(updatedConversation);
        // Update in conversations list
        setConversations(prev =>
          prev.map(conv =>
            conv.id === updatedConversation.id ? updatedConversation : conv
          )
        );
      }
    );
  };

  const markMessagesAsRead = async () => {
    if (selectedConversation?.id) {
      try {
        await chatService.markMessagesAsRead(selectedConversation.id, currentUser.id);
        console.log('✅ Messages marked as read, notifying parent...');
        
        // Reload conversation to get updated readBy
        const updated = await chatService.getConversation(selectedConversation.id);
        if (updated) {
          setSelectedConversation(updated);
          setConversations(prev => {
            const newConvs = prev.map(conv => 
              conv && conv.id === updated.id ? updated : conv
            ).filter(Boolean);
            
            // Log unread count after update
            const totalUnread = newConvs.reduce((sum, conv) => {
              return sum + (conv.messages || []).filter(
                msg => msg.senderId !== currentUser.id && 
                       (!msg.readBy || !msg.readBy.includes(currentUser.id))
              ).length;
            }, 0);
            console.log(`📊 Frontend total unread after mark: ${totalUnread}`);
            
            return newConvs;
          });
        }
        
        // Notify parent to reload unread count
        if (onMessagesRead) {
          onMessagesRead();
        }
      } catch (error) {
        console.error('❌ Failed to mark messages as read:', error);
      }
    } else {
      console.log('⏭️ Skipping mark as read (no conversation id)');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      const trimmed = message.trim();
      // optimistic message
      const tempMsg = {
        id: `temp_${Date.now()}`,
        senderId: currentUser.id,
        text: trimmed,
        timestamp: Date.now(),
        readBy: [currentUser.id],
        pending: true
      };

      // Append immediately to selectedConversation and conversations list (optimistic UI)
      setSelectedConversation(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), tempMsg]
      }));

      setConversations(prev => {
        if (selectedConversation?.id) {
          return prev.map(conv => conv.id === selectedConversation.id ? ({ ...conv, messages: [...(conv.messages || []), tempMsg] }) : conv);
        }
        const participants = [currentUser.id, draftTargetId || (selectedConversation?.participants || []).find(p => p !== currentUser.id)];
        const newConv = { id: null, participants: participants.sort(), messages: [tempMsg] };
        return [newConv, ...prev];
      });

      // clear input for responsive UX
      setMessage('');

      // send to backend (create conversation if needed)
      const participantsForCreate = selectedConversation?.id ? null : [currentUser.id, draftTargetId || (selectedConversation?.participants || []).find(p => p !== currentUser.id)];
      const res = await chatService.sendMessage(selectedConversation?.id, currentUser.id, trimmed, participantsForCreate);

      // replace temp message with authoritative message
      const realMsg = res.message;
      setSelectedConversation(prev => ({
        ...prev,
        id: res.conversationId || prev.id,
        messages: (prev.messages || []).map(m => m.id === tempMsg.id ? realMsg : m)
      }));

      setConversations(prev => prev.map(conv => {
        // match by id or by participants when id was null
        if (conv.id && conv.id === (res.conversationId || selectedConversation?.id)) {
          return { ...conv, messages: (conv.messages || []).map(m => m.id === tempMsg.id ? realMsg : m) };
        }
        const convParticipantsKey = (conv.participants || []).slice().sort().join(',');
        const createdParticipantsKey = (participantsForCreate || []).slice().sort().join(',');
        if (!conv.id && res.conversationId && convParticipantsKey === createdParticipantsKey) {
          return { id: res.conversationId, participants: conv.participants, messages: (conv.messages || []).map(m => m.id === tempMsg.id ? realMsg : m) };
        }
        return conv;
      }));
    } catch (error) {
      console.error('Không thể gửi tin nhắn. Vui lòng thử lại.', error);
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = (conversation) => {
    const otherUserId = conversation.participants.find(id => id !== currentUser.id);
    return usersMap[otherUserId];
  };

  const getUnreadCount = (conversation) => {
    return (conversation.messages || []).filter(
      msg => msg.senderId !== currentUser.id && 
             (!msg.readBy || !msg.readBy.includes(currentUser.id))
    ).length;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const navigate = useNavigate();

  // Guard: Don't render if currentUser is not available
  if (!currentUser) {
    return (
      <div style={{ padding: '24px', color: '#9CA3AF', fontSize: '14px' }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div style={{
      height: 'calc(100vh - 140px)',
      display: 'flex',
      backgroundColor: '#F9FAFB'
    }}>
      {/* Conversations List */}
      <div style={{
        width: '350px',
        backgroundColor: 'white',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            Tin nhắn
          </h2>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto'
        }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '24px', color: '#9CA3AF', fontSize: '14px' }}>
              Chưa có cuộc trò chuyện nào.
            </div>
          ) : conversations.filter(conv => conv && conv.id).map(conversation => {
            const otherUser = getOtherParticipant(conversation);
            const unreadCount = getUnreadCount(conversation);
            const lastMessage = conversation.messages?.[conversation.messages.length - 1];
            const isSelected = selectedConversation?.id === conversation.id;

            return (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                style={{
                  padding: '16px',
                  backgroundColor: isSelected ? '#EEF2FF' : 'transparent',
                  borderLeft: isSelected ? '3px solid #4F46E5' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderBottom: '1px solid #F3F4F6'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  {otherUser?.avatar ? (
                    <img
                      src={otherUser.avatar}
                      alt={otherUser.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <User size={24} color="#6B7280" />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {otherUser?.name || 'User'}
                      </div>
                      {lastMessage && (
                        <div style={{
                          fontSize: '12px',
                          color: '#9CA3AF',
                          flexShrink: 0,
                          marginLeft: '8px'
                        }}>
                          {formatTime(lastMessage.timestamp || lastMessage.createdAt)}
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      {lastMessage && (
                        <div style={{
                          fontSize: '13px',
                          color: unreadCount > 0 ? '#111827' : '#6B7280',
                          fontWeight: unreadCount > 0 ? '600' : '400',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {lastMessage.senderId === currentUser.id ? 'Bạn: ' : ''}
                          {lastMessage.text || lastMessage.content}
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <div style={{
                          minWidth: '20px',
                          height: '20px',
                          backgroundColor: '#4F46E5',
                          color: 'white',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 6px',
                          flexShrink: 0,
                          marginLeft: '8px'
                        }}>
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white'
        }}>
          {/* Chat Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between'
          }}>
            {(() => {
              const otherUser = getOtherParticipant(selectedConversation);
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {otherUser?.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={20} color="#6B7280" />
                      </div>
                    )}
                    <div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        {otherUser?.name || 'User'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6B7280'
                      }}>
                        {otherUser?.role === 'landlord' ? 'Chủ nhà' : 'Sinh viên'}
                      </div>
                    </div>
                  </div>
                  {otherUser?.id && (
                    <button
                      onClick={() => navigate(`/u/${otherUser.id}`)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                    >
                      Xem hồ sơ
                    </button>
                  )}
                </>
              );
            })()}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: '#F9FAFB'
          }}>
            {(selectedConversation.messages || []).map((msg, index) => {
              const isOwn = msg.senderId === currentUser.id;
              const msgTime = msg.timestamp || msg.createdAt;
              const prevMsgTime = index > 0 ? (selectedConversation.messages[index - 1].timestamp || selectedConversation.messages[index - 1].createdAt) : null;
              const showTime = index === 0 || (prevMsgTime && (prevMsgTime - msgTime) > 300000);

              return (
                <div key={msg.id}>
                  {showTime && (
                    <div style={{
                      textAlign: 'center',
                      margin: '16px 0',
                      fontSize: '12px',
                      color: '#9CA3AF'
                    }}>
                      {formatTime(msgTime)}
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '10px 14px',
                      backgroundColor: isOwn ? '#4F46E5' : 'white',
                      color: isOwn ? 'white' : '#111827',
                      borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}>
                      {msg.text || msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '20px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              gap: '12px'
            }}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: '24px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
            <button
              type="submit"
              disabled={!message.trim() || isSending}
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: message.trim() && !isSending ? '#4F46E5' : '#E5E7EB',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: message.trim() && !isSending ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBox;