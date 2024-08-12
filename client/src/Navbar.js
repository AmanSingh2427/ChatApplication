import React, { useEffect, useState } from 'react';
import { FaBell, FaSignOutAlt, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCreateGroup = () => {
    navigate('/group');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="logo">ChatApp</h1>
        <div className="navbar-right">
          {user && (
            <div className="user-info">
              <img src={`http://localhost:5000/${user.profilePicture}`} alt="Profile" className="profile-picture" />
              <span className="user-name">{user.username}</span>
            </div>
          )}
          <button className="icon-button" onClick={handleCreateGroup}>
            <FaUsers className="icon" />
            <span className="button-text">Create Group</span>
          </button>
          <button className="icon-button" onClick={handleLogout}>
            <FaSignOutAlt className="icon" />
            <span className="button-text">Logout</span>
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
