import React, { useState } from 'react';
import { ApiClient } from '../../client';
import { User } from '../../types';
import styles from './LoginForm.module.css';

interface LoginFormProps {
  client: ApiClient;
  onLoginSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ client, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isLogin) {
        if (password !== confirmPassword) {
          setError("Passwords don't match");
          setIsLoading(false);
          return;
        }

        if (!profilePicture) {
          setError("Please select a profile picture");
          setIsLoading(false);
          return;
        }

        // Handle registration with profile picture
        const registerResponse = await client.register({
          username: username,
          password: password,
          profile_picture: profilePicture
        });

        if (registerResponse.ok) {
          // If registration successful, attempt login
          const loginResponse = await client.login({
            username: username,
            password: password,
          });

          if (loginResponse.ok && loginResponse.user) {
            localStorage.setItem('username', username);
            localStorage.setItem('password', password);
            onLoginSuccess(loginResponse.user);
          } else {
            setError('Registration successful but login failed. Please try logging in.');
          }
        } else {
          setError(registerResponse.message || 'Registration failed. Please try again.');
        }
      } else {
        // Handle login (unchanged)
        const loginResponse = await client.login({
          username: username,
          password: password,
        });

        if (loginResponse.ok && loginResponse.user) {
          localStorage.setItem('username', username);
          localStorage.setItem('password', password);
          onLoginSuccess(loginResponse.user);
        } else {
          setError(loginResponse.message || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      setError(isLogin 
        ? 'Unable to connect to login service' 
        : 'Unable to connect to registration service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        {!isLogin && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="profilePicture">Profile Picture:</label>
              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                required
                disabled={isLoading}
              />
            </div>
          </>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading 
            ? 'Please wait...' 
            : isLogin 
              ? 'Login' 
              : 'Create Account'}
        </button>

        <button 
          type="button" 
          className={styles.switchButton}
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setProfilePicture(null);
          }}
          disabled={isLoading}
        >
          {isLogin 
            ? "Don't have an account? Sign up" 
            : 'Already have an account? Login'}
        </button>
      </form>
    </div>
  );
};