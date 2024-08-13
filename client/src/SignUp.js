import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SignUp.css';
import { FaUser, FaEnvelope, FaLock, FaFileUpload, FaEye, FaEyeSlash } from 'react-icons/fa';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    file: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    if (!formData.file) {
      errors.file = 'Profile picture is required';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      const form = new FormData();
      form.append('fullName', formData.fullName);
      form.append('email', formData.email);
      form.append('username', formData.username);
      form.append('password', formData.password);
      form.append('file', formData.file);

      try {
        const response = await axios.post('http://192.168.1.129:5000/signup', form, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.status === 201) {
          toast.success('You are registered successfully!');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setMessage('Unexpected response status');
        }
      } catch (error) {
        if (error.response && error.response.data) {
          setMessage(error.response.data.message);
        } else {
          setMessage('An error occurred. Please try again.');
        }
      }
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-form">
        <h2>Sign Up</h2>
       
        <div className="form-group">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
          />
          <FaUser className="icon" />
          {errors.fullName && <p className="error">{errors.fullName}</p>}
        </div>
        <div className="form-group">
          <input
            type="text"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <FaEnvelope className="icon" />
          {errors.email && <p className="error">{errors.email}</p>}
           {message && <p className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</p>}
        </div>
        <div className="form-group">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />
          <FaUser className="icon" />
          {errors.username && <p className="error">{errors.username}</p>}
        </div>
        <div className="form-group relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <span onClick={togglePasswordVisibility} className="password-toggle">
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
          <FaLock className="icon" />
          {errors.password && <p className="error">{errors.password}</p>}
        </div>
        <div className="form-group">
          <input
            type="file"
            name="file"
            onChange={handleChange}
          />
          <FaFileUpload className="icon" />
          {errors.file && <p className="error">{errors.file}</p>}
        </div>
        <button type="submit">Sign Up</button>
       
        <div className="login-link">
          <a href="/login">Already have an account? Login</a>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

export default SignUp;
