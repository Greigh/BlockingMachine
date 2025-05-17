import React, { useState, useEffect } from 'react';
import './index.css';
import type { ThemeType, FilterFormat } from './types/';

interface SettingsProps {
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentTheme, onThemeChange }) => {
  // Existing state variables
  const [exportFormat, setExportFormat] = useState('');
  const [isLoadingFormat, setIsLoadingFormat] = useState(true);
  const [isSavingFormat, setIsSavingFormat] = useState(false);
  const [formatMessage, setFormatMessage] = useState<{
    text: string;
    type: 'success' | 'error' | null;
  }>({ text: '', type: null });

  // Path state variables
  const [savePath, setSavePath] = useState('');
  const [isLoadingPath, setIsLoadingPath] = useState(true);
  const [isSavingPath, setIsSavingPath] = useState(false);
  const [pathMessage, setPathMessage] = useState('');

  useEffect(() => {
    // Load export format
    const loadExportFormat = async () => {
      try {
        const format = await window.electron.getExportFormat();
        setExportFormat(format);
      } catch (error) {
        console.error('Error loading format:', error);
      } finally {
        setIsLoadingFormat(false);
      }
    };

    // Load save path
    const loadSavePath = async () => {
      try {
        const path = await window.electron.getSavePath();
        setSavePath(path);
      } catch (error) {
        console.error('Error loading path:', error);
      } finally {
        setIsLoadingPath(false);
      }
    };

    loadExportFormat();
    loadSavePath();
  }, []);

  const handleFormatChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const format = e.target.value as FilterFormat;
    setExportFormat(format);
    setIsSavingFormat(true);

    try {
      await window.electron.setExportFormat(format);
      showTemporaryMessage('Format updated successfully', 'success', setFormatMessage);
    } catch (error) {
      console.error('Error saving format:', error);
      showTemporaryMessage('Failed to save format', 'error', setFormatMessage);
    } finally {
      setIsSavingFormat(false);
    }
  };

  const handlePathChange = async () => {
    const selectedPath = await window.electron.selectSavePath();
    if (selectedPath && typeof selectedPath === 'string') {
      setSavePath(selectedPath);
      await window.electron.setSavePath(selectedPath);
      setPathMessage('Path updated successfully!');
      setTimeout(() => {
        setPathMessage('');
      }, 3000);
    } else {
      setPathMessage('No path selected.');
    }
  };

  // Helper for showing temporary success/error messages
  const showTemporaryMessage = (
    text: string,
    type: 'success' | 'error',
    setMessage: React.Dispatch<
      React.SetStateAction<{ text: string; type: 'success' | 'error' | null }>
    >
  ) => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: null });
    }, 3000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <p className="settings-description">
          Configure Blockingmachine's behavior and appearance
        </p>
      </div>

      <div className="settings-grid">
        {/* Theme Setting */}
        <div className="setting-card">
          <div className="setting-card-header">
            <h3>
              <span className="setting-icon">🎨</span>
              Theme
            </h3>
          </div>
          <p>Choose how Blockingmachine appears</p>

          <div className="theme-preview-container">
            <div
              className={`theme-preview theme-preview-light ${currentTheme === 'light' ? 'selected' : ''}`}
              onClick={() => onThemeChange('light')}
            >
              <div className="theme-preview-label">Light</div>
            </div>
            <div
              className={`theme-preview theme-preview-dark ${currentTheme === 'dark' ? 'selected' : ''}`}
              onClick={() => onThemeChange('dark')}
            >
              <div className="theme-preview-label">Dark</div>
            </div>
            <div
              className={`theme-preview theme-preview-system ${currentTheme === 'system' ? 'selected' : ''}`}
              onClick={() => onThemeChange('system')}
            >
              <div className="theme-preview-label">System</div>
            </div>
          </div>
        </div>

        {/* Export Format Setting */}
        <div className="setting-card">
          <div className="setting-card-header">
            <h3>
              <span className="setting-icon">📄</span>
              Export Format
            </h3>
            <span className="setting-badge secondary">Output</span>
          </div>
          <p>Select the format for generated filter lists</p>

          {isLoadingFormat ? (
            <div className="loading-path">
              <div className="path-loader"></div>
              <span>Loading format preferences...</span>
            </div>
          ) : (
            <>
              <div className="select-container">
                <select
                  className="styled-select"
                  value={exportFormat}
                  onChange={handleFormatChange}
                  disabled={isSavingFormat}
                >
                  <option value="adguard">AdGuard</option>
                  <option value="abp">AdBlock Plus</option>
                  <option value="hosts">Hosts File</option>
                  <option value="dnsmasq">DNSMasq</option>
                  <option value="unbound">Unbound</option>
                  <option value="domains">Domain List</option>
                  <option value="plain">Plain Text</option>
                </select>
                <div className="select-arrow">▼</div>
              </div>

              {formatMessage.text && (
                <div className={`setting-message ${formatMessage.type}`}>
                  {formatMessage.text}
                </div>
              )}

              <div className="setting-note">
                <div className="note-icon">ℹ️</div>
                <div className="note-text">
                  The selected format affects how rules are generated and what
                  applications can use them.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Save Path Setting */}
        <div className="setting-card">
          <div className="setting-card-header">
            <h3>
              <span className="setting-icon">📂</span>
              Save Location
            </h3>
            <span className="setting-badge primary">File</span>
          </div>
          <p>Choose where to save generated filter lists</p>

          {isLoadingPath ? (
            <div className="loading-path">
              <div className="path-loader"></div>
              <span>Loading path settings...</span>
            </div>
          ) : (
            <div>
              <div className="path-input-container">
                <input
                  type="text"
                  className="path-input"
                  value={savePath}
                  readOnly
                />
                <button
                  className="browse-button"
                  onClick={handlePathChange}
                  disabled={isSavingPath}
                >
                  {isSavingPath ? 'Selecting...' : 'Browse...'}
                </button>
              </div>

              {pathMessage && <p>{pathMessage}</p>}

              {savePath && (
                <div>
                  <div className="path-preview">
                    <div className="note-icon">ℹ️</div>

                    {savePath}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* About / Contact Section */}
        <div className="setting-card">
          <div className="setting-card-header">
            <h3>
              <span className="setting-icon">ℹ️</span>
              About & Contact
            </h3>
            <span className="setting-badge secondary">Info</span>
          </div>
          <p>Get in touch or follow the project:</p>
          <ul className="contact-list">
            <li>
              <span className="contact-icon">
                {/* Globe SVG */}
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <ellipse
                    cx="12"
                    cy="12"
                    rx="4"
                    ry="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="2"
                    y1="12"
                    x2="22"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <a
                href="https://danielhipskind.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                danielhipskind.com
              </a>
            </li>
            <li>
              <span className="contact-icon">
                {/* GitHub SVG */}
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.84c.85.004 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .26.18.57.69.47A10.01 10.01 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
                  />
                </svg>
              </span>
              <a
                href="https://github.com/greigh/blockingmachine"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/greigh/blockingmachine
              </a>
            </li>
            <li>
              <span className="contact-icon">
                {/* Twitter SVG */}
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.46 6c-.77.35-1.6.58-2.47.69a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.82 1.92 3.6-.7-.02-1.36-.21-1.94-.53v.05c0 2.1 1.5 3.85 3.5 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.7 2.1 2.94 3.95 2.97A8.6 8.6 0 0 1 2 19.54c-.29 0-.57-.02-.85-.05A12.13 12.13 0 0 0 8.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 22.46 6z"
                  />
                </svg>
              </span>
              <a
                href="https://twitter.com/danielhipskind_"
                target="_blank"
                rel="noopener noreferrer"
              >
                @danielhipskind_
              </a>
            </li>
            <li>
              <span className="contact-icon">
                {/* Mastodon SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="6" fill="#6364FF" />
                  <path
                    d="M17.5 10.5c0 2.5-.5 4-1.5 5s-2.5 1.5-4 1.5-3-.5-4-1.5-1.5-2.5-1.5-5V8.5c0-1 .5-1.5 1.5-1.5h8c1 0 1.5.5 1.5 1.5v2z"
                    fill="#fff"
                  />
                  <ellipse cx="9.5" cy="12" rx="1" ry="1.5" fill="#6364FF" />
                  <ellipse cx="14.5" cy="12" rx="1" ry="1.5" fill="#6364FF" />
                </svg>
              </span>
              <a
                href="https://mastodon.social/@danielhipskind"
                target="_blank"
                rel="me noopener noreferrer"
              >
                @danielhipskind@mastodon.social
              </a>
            </li>
            <li>
              <span className="contact-icon">
                {/* Bluesky SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#0091FF" />
                  <path
                    d="M7 13c2 2 8 2 10 0"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="9" cy="10" r="1" fill="#fff" />
                  <circle cx="15" cy="10" r="1" fill="#fff" />
                </svg>
              </span>
              <a
                href="https://bsky.app/profile/danielhipskind"
                target="_blank"
                rel="noopener noreferrer"
              >
                @danielhipskind.com
              </a>
            </li>
            <li>
              <span className="contact-icon">
                {/* Email SVG */}
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="3"
                    stroke="#007bff"
                    strokeWidth="2"
                    fill="#fff"
                  />
                  <path
                    d="M3 7l9 6 9-6"
                    stroke="#007bff"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </span>
              <a href="mailto:me@danielhipskind.com">me@danielhipskind.com</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
