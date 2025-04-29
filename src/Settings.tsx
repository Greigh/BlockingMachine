import React, { useState, useEffect } from 'react';
import type { FilterSource, ProcessingResult, Theme, ElectronAPI } from './types/global.js';
import type { FilterFormat } from '@blockingmachine/core';

interface SettingsProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
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
  const [pathMessage, setPathMessage] = useState<{
    text: string;
    type: 'success' | 'error' | null;
  }>({ text: '', type: null });

  useEffect(() => {
    // Load export format
    const loadExportFormat = async () => {
      try {
        const format = await window.electronAPI.getExportFormat();
        setExportFormat(format);
      } catch (error) {
        console.error("Error loading format:", error);
      } finally {
        setIsLoadingFormat(false);
      }
    };

    // Load save path
    const loadSavePath = async () => {
      try {
        const path = await window.electronAPI.getSavePath();
        setSavePath(path);
      } catch (error) {
        console.error("Error loading path:", error);
      } finally {
        setIsLoadingPath(false);
      }
    };

    loadExportFormat();
    loadSavePath();
  }, []);

  const handleFormatChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const format = e.target.value;
    setExportFormat(format);
    setIsSavingFormat(true);
    
    try {
      await window.electronAPI.setExportFormat(format);
      showTemporaryMessage('Format updated successfully', 'success', setFormatMessage);
    } catch (error) {
      console.error("Error saving format:", error);
      showTemporaryMessage('Failed to save format', 'error', setFormatMessage);
    } finally {
      setIsSavingFormat(false);
    }
  };
  
  const handlePathChange = async () => {
    setIsSavingPath(true);
    
    try {
      const result = await window.electronAPI.browseSavePath();
      if (result.success && result.path) {
        setSavePath(result.path);
        await window.electronAPI.setSavePath(result.path);
        showTemporaryMessage('Path updated successfully', 'success', setPathMessage);
      }
    } catch (error) {
      console.error("Error choosing path:", error);
      showTemporaryMessage('Failed to update path', 'error', setPathMessage);
    } finally {
      setIsSavingPath(false);
    }
  };
  
  // Helper for showing temporary success/error messages
  const showTemporaryMessage = (
    text: string, 
    type: 'success' | 'error', 
    setMessage: React.Dispatch<React.SetStateAction<{ text: string; type: 'success' | 'error' | null; }>>
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
                  The selected format affects how rules are generated and what applications can use them.
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
            <>
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
              
              {pathMessage.text && (
                <div className={`setting-message ${pathMessage.type}`}>
                  {pathMessage.text}
                </div>
              )}
              
              {savePath && (
                <div className="path-preview">
                  {savePath}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;