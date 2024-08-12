import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './Chat.css';

const Chat = ({ selectedUser, selectedGroup }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null); // For user details
  const [selectedGroupDetails, setSelectedGroupDetails] = useState(null); // For group details
  const endOfMessagesRef = useRef(null); // Ref for scrolling

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const socketIo = io('http://localhost:5000');

    if (selectedUser) {
      socketIo.emit('join-room', selectedUser);
    }

    if (selectedGroup) {
      socketIo.emit('join-group', selectedGroup);
    }

    // Listen for private messages
    socketIo.on('receive-message', (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    // Listen for group messages
    socketIo.on('receive-group-message', (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [selectedUser, selectedGroup]);


  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUser) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:5000/messages', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              receiverId: selectedUser,
            },
          });
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching messages', error);
        }
      }

      if (selectedGroup) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:5000/groups/${selectedGroup}/messages`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching group messages', error);
        }
      }
    };

    fetchMessages();
  }, [selectedUser, selectedGroup]);


  useEffect(() => {
    const fetchUserDetails = async () => {
      if (selectedUser) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:5000/users/${selectedUser}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setSelectedUserDetails(response.data);
        } catch (error) {
          console.error('Error fetching user details', error);
        }
      }
    };

    const fetchGroupDetails = async () => {
      if (selectedGroup) {

        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:5000/groups/${selectedGroup}`, {

            headers: {
              Authorization: `Bearer ${token}`
            }
          });


          setSelectedGroupDetails(response.data);

        } catch (error) {
          console.error('Error fetching group details', error);
        }
      }
    };

    fetchUserDetails();
    fetchGroupDetails();
  }, [selectedUser, selectedGroup]);

  useEffect(() => {
    // Scroll to the bottom of the chat container
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (message.trim() && (selectedUser || selectedGroup)) {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');

      try {
        if (selectedUser) {
          const response = await axios.post('http://localhost:5000/send-message', {
            receiverId: selectedUser,
            message,
            senderId: userId,
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 201) {
            const messageData = response.data;
            socket.emit('send-message', messageData);
            setMessage('');
          }
        }

        if (selectedGroup) {
          const response = await axios.post('http://localhost:5000/send-group-message', {
            groupId: selectedGroup,
            message,
            senderId: userId,
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 201) {
            const messageData = response.data;
            socket.emit('send-group-message', messageData);
            setMessage('');
          }
        }
      } catch (error) {
        console.error('Error sending message', error);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent the default action (like form submission)
      handleSend(); // Call the send message function
    }
  };



  return (
    <div className="chat-container">
      <h2 className="chat-title">
        {selectedUserDetails ? `Chat with ${selectedUserDetails.fullname}` :
          selectedGroupDetails ? `Chat in ${selectedGroupDetails.group_name}` :
            "Let's Chat"}
      </h2>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.sender_id == localStorage.getItem('user_id') ? 'sent' : 'received'}`}
          >
            <p>{msg.message}</p>
            <span className="chat-timestamp">
              {new Date(msg.created_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={endOfMessagesRef} /> {/* This empty div is the target for scrolling */}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
          disabled={!selectedUser && !selectedGroup}
          onKeyDown={handleKeyDown} // Add this line
        />

        <button onClick={handleSend} className="chat-send-button" disabled={!selectedUser && !selectedGroup}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;