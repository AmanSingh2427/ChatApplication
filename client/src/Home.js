import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Chat from './Chat';
import './Home.css'; // Ensure this is the correct path

const Home = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const handleSelectUser = (userId) => {
    setSelectedUser(userId);
    setSelectedGroup(null); // Deselect group if a user is selected
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroup(groupId);
    setSelectedUser(null); // Deselect user if a group is selected
  };

  return (
    <div className="layout-container">
      <Navbar className="navbar" />
      <div className="main-content">
        <Sidebar onSelectUser={handleSelectUser} onSelectGroup={handleSelectGroup} className="sidebar" />
        <Chat selectedUser={selectedUser} selectedGroup={selectedGroup} className="chat-container" />
      </div>
    </div>
  );
};

export default Home;
