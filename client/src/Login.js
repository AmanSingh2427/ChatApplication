import React, { useState } from 'react';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validate form fields
  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      try {
        const response = await axios.post('http://localhost:5000/login', formData);
        console.log('Login successful', response.data);
  
        // Save the token and user data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('user_id', response.data.user.id); // Save user ID separately
  
        console.log("Stored user ID in localStorage:", localStorage.getItem('user_id'));
  
        // Show success notification
        toast.success('You are logged in successfully!');
  
        // Navigate to the home page after a short delay
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } catch (err) {
        setLoginError('Invalid email or password');
      }
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        <div className="form-group">
          <div className="input-container">
            <input
              type="text"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
            />
            <FaEnvelope className="input-icon" />
          </div>
          {errors.email && <p className="error">{errors.email}</p>}
        </div>
        <div className="form-group">
          <div className="input-container">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
            />
            <FaLock className="input-icon" />
          </div>
          {errors.password && <p className="error">{errors.password}</p>}
        </div>
        {loginError && <p className="error">{loginError}</p>}
        <button type="submit">Login</button>
        <div className="signup-link">
          <a href="/">Don't have an account? Sign Up</a>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

export default Login;
