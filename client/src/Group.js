import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Group.css';

const Group = () => {
  const [fullNames, setFullNames] = useState([]);
  const [checkedNames, setCheckedNames] = useState([]);
  const [groupName, setGroupName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFullNames = async () => {
      try {
        const response = await axios.get('http://localhost:5000/fullnames');
        setFullNames(response.data);
      } catch (error) {
        console.error('Error fetching full names:', error);
        toast.error('Failed to fetch names.');
      }
    };

    fetchFullNames();
  }, []);

  const handleCheckboxChange = (name) => {
    setCheckedNames((prev) => {
      if (prev.includes(name)) {
        return prev.filter((n) => n !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  const handleBackButtonClick = () => {
    navigate('/home');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate group name
    if (!groupName.trim()) {
      toast.error('Please enter a group name.');
      return;
    }

    // Check if at least two members are selected
    if (checkedNames.length < 2) {
      toast.error('Please select at least two members for this group.');
      return;
    }

    try {
      // Create group
      const groupResponse = await axios.post('http://localhost:5000/create-group', {
        groupName,
      });

      const groupId = groupResponse.data.groupId;

      // Add members to group
      const userIds = fullNames
        .filter(user => checkedNames.includes(user.fullname))
        .map(user => user.id);

      await axios.post('http://localhost:5000/add-group-members', {
        groupId,
        userIds,
      });

      // Set success notification
      toast.success('Group created successfully.');

      setTimeout(() => {
        navigate('/home');
      }, 2000); // 2-second delay before redirecting

    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('An error occurred while creating the group.');
    }
  };

  return (
    <div className="group-page">
      <h2>Create Group</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="group-name">Group Name:</label>
        <input
          type="text"
          id="group-name"
          placeholder='Enter Group Name'
          name="group-name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <div className="full-names">
          {fullNames.map((user, index) => (
            <div key={index} className="checkbox-wrapper">
              <input
                type="checkbox"
                id={`user-${index}`}
                name="group-members"
                value={user.fullname}
                checked={checkedNames.includes(user.fullname)}
                onChange={() => handleCheckboxChange(user.fullname)}
              />
              <label htmlFor={`user-${index}`}>{user.fullname}</label>
            </div>
          ))}
        </div>

        <button type="submit">Create Group</button>
      </form>

      <button className="back-button" onClick={handleBackButtonClick}>
        Back
      </button>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Group;
