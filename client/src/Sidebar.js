import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Sidebar.css';

const Sidebar = ({ onSelectUser, onSelectGroup }) => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchUsersAndGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch users
        const usersResponse = await axios.get('http://192.168.1.129:5000/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUsers(usersResponse.data);

        // Fetch groups
        const groupsResponse = await axios.get('http://192.168.1.129:5000/groups', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setGroups(groupsResponse.data);

      } catch (error) {
        console.error('Error fetching users or groups', error);
      }
    };

    fetchUsersAndGroups();
  }, []);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleUserClick = (id, type) => {

    setSelectedId(id);
    if (type === 'user') {
      onSelectUser(id);
    } else if (type === 'group') {
      onSelectGroup(id);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.group_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sidebar">
      <input
        type="text"
        placeholder="Search users or groups..."
        value={searchQuery}
        onChange={handleSearch}
        className="sidebar-search"
      />
      <ul className="sidebar-users">
        {filteredUsers.map((user) => (
          <li
            key={user.id}
            className={`sidebar-user-item ${selectedId === user.id ? 'selected' : ''}`}
            onClick={() => handleUserClick(user.id, 'user')}
          >
            <img
              src={`http://192.168.1.129:5000/${user.profile_picture}`}
              alt={user.username}
              className="sidebar-user-pic"
            />
            <span className="sidebar-user-name">
              {user.fullname}
              {/* {user.unread_messages > 0 && (
                <span className="unread-messages">{user.unread_messages}</span>
              )} */}
            </span>
          </li>
        ))}
        {filteredGroups.map((group) => (
          <li
            key={group.us_id}
            className={`sidebar-user-item ${selectedId === group.id ? 'selected' : ''}`}
            onClick={() => handleUserClick(group.us_id, 'group')}
          >
            <span className="sidebar-user-name">{group.group_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;