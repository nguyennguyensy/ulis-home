import React from 'react';
import ChatBox from '../student/ChatBox';

// LandlordChat sử dụng lại component ChatBox của Student vì logic giống nhau
const LandlordChat = ({ currentUser, draftTargetId, onMessagesRead }) => {
  return <ChatBox currentUser={currentUser} draftTargetId={draftTargetId} onMessagesRead={onMessagesRead} />;
};

export default LandlordChat;