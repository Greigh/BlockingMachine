import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

import Settings from './Settings';
import './index.css';
import type { FilterSource, ProcessingResult, Theme, ElectronAPI } from './types/global.js';

// --- Helper Function (applyTheme) ---
const applyTheme = (theme: Theme) => {
  const body = document.body;
  body.classList.remove('light-theme', 'dark-theme');

  if (theme === 'light') {
    body.classList.add('light-theme');
  } else if (theme === 'dark') {
    body.classList.add('dark-theme');
  } else { // System theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      body.classList.add('dark-theme');
    } else {
      body.classList.add('light-theme');
    }
  }
};

// --- BulkImportManager Component ---
interface BulkImportManagerProps {
  currentSources: FilterSource[];
  saveSources: (updatedSources: FilterSource[], successMsg?: string) => Promise<void>;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}

const BulkImportManager: React.FC<BulkImportManagerProps> = ({
  currentSources,
  saveSources,
  setError,
  setSuccessMessage
}) => {
  const [bulkUrls, setBulkUrls] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleBulkImport = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsImporting(true);

    const urls = bulkUrls.split('\n').map(url => url.trim()).filter(url => url.length > 0);
    if (urls.length === 0) {
      setError("No URLs entered in the bulk import field.");
      setIsImporting(false);
      return;
    }

    let newSources: FilterSource[] = [];
    let importErrors: string[] = [];
    let skippedCount = 0;

    urls.forEach((url, lineIndex) => {
      try {
        const parsedUrl = new URL(url);
        if (currentSources.some(s => s.url === url) || newSources.some(s => s.url === url)) {
          skippedCount++;
          return;
        }
        
        let name = parsedUrl.hostname.replace(/^www\./, '');
        let originalName = name;
        let counter = 1;
        
        while (currentSources.concat(newSources).some(s => s.name === name)) {
          name = `${originalName} (${++counter})`;
        }

        newSources.push({ name, url, enabled: true });
      } catch (e) {
        importErrors.push(`Line ${lineIndex + 1}: Invalid URL "${url}"`);
      }
    });

    let finalSuccessMessage = '';
    let finalErrorMessage = '';

    if (newSources.length > 0) {
      const updatedSources = [...currentSources, ...newSources];
      try {
        await saveSources(updatedSources);
        finalSuccessMessage = `Imported ${newSources.length} new sources.` + 
          (skippedCount > 0 ? ` Skipped ${skippedCount} duplicates.` : '');
        setBulkUrls('');
      } catch (saveError) {
        finalErrorMessage = `Failed to save imported sources. ${saveError instanceof Error ? saveError.message : ''}`;
      }
    } else if (importErrors.length === 0 && skippedCount > 0) {
      finalSuccessMessage = `Skipped ${skippedCount} duplicate URLs. No new sources added.`;
    }

    if (importErrors.length > 0) {
      finalErrorMessage = (finalErrorMessage ? finalErrorMessage + '\n' : '') + 
        `Bulk import errors:\n${importErrors.join('\n')}`;
    }

    if (finalSuccessMessage) setSuccessMessage(finalSuccessMessage);
    if (finalErrorMessage) setError(finalErrorMessage);

    setIsImporting(false);
  };

  return (
    <div className="section">
      <h2>Bulk Import Sources</h2>
      <p>Enter one source URL per line. Duplicates based on URL will be skipped.</p>
      <textarea
        value={bulkUrls}
        onChange={(e) => setBulkUrls(e.target.value)}
        placeholder="https://example.com/list1.txt&#10;https://example.org/anotherlist.txt"
        rows={10}
        disabled={isImporting}
      />
      <button onClick={handleBulkImport} disabled={!bulkUrls.trim() || isImporting}>
        {isImporting ? 'Importing...' : 'Import URLs'}
      </button>
    </div>
  );
};
// --- End BulkImportManager Component ---

// --- SourcesManager Component ---
interface SourcesManagerProps {
  sources: FilterSource[];
  saveSources: (updatedSources: FilterSource[], successMsg?: string) => Promise<void>;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}

const SourcesManager: React.FC<SourcesManagerProps> = ({
  sources,
  saveSources,
  setError,
  setSuccessMessage
}) => {
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  // --- Handlers ---
  const handleAddSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      setError("Source name and URL cannot be empty.");
      return;
    }
    
    // Basic URL validation (consider a more robust library if needed)
    try {
      new URL(newSourceUrl);
    } catch (_) {
      setError("Invalid URL format.");
      return;
    }

    // Check for duplicate name or URL before adding
    if (sources.some(s => s.name === newSourceName.trim() || s.url === newSourceUrl.trim())) {
      setError("Source with this name or URL already exists.");
      return;
    }

    const newSource: FilterSource = {
      name: newSourceName.trim(),
      url: newSourceUrl.trim(),
      enabled: true, // Default to enabled
    };

    const updatedSources = [...sources, newSource];
    saveSources(updatedSources, `Source "${newSource.name}" added.`)
      .then(() => {
        // Clear input fields only on successful save
        setNewSourceName('');
        setNewSourceUrl('');
      });
  };

  const handleRemoveSource = (indexToRemove: number) => {
    const sourceName = sources[indexToRemove]?.name || 'Source';
    const updatedSources = sources.filter((_, index) => index !== indexToRemove);
    saveSources(updatedSources, `"${sourceName}" removed.`);
  };

  const handleToggleEnabled = (indexToToggle: number) => {
    const updatedSources = sources.map((source, index) => {
      if (index === indexToToggle) {
        return { ...source, enabled: !source.enabled };
      }
      return source;
    });
    saveSources(updatedSources);
  };

  // vvv Handlers for editing vvv
  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditName(sources[index].name);
    setEditUrl(sources[index].url);
    setError(null); // Clear errors when starting edit
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditName('');
    setEditUrl('');
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    if (!editName.trim() || !editUrl.trim()) {
      setError("Source name and URL cannot be empty during edit.");
      return;
    }
    try {
      new URL(editUrl); // Validate URL
    } catch (_) {
      setError("Invalid URL format during edit.");
      return;
    }

    // Check if name/URL conflicts with *other* existing sources
    if (sources.some((s, i) => i !== editingIndex && (s.name === editName.trim() || s.url === editUrl.trim()))) {
      setError("Edited name or URL conflicts with another existing source.");
      return;
    }

    const updatedSources = sources.map((source, index) => {
      if (index === editingIndex) {
        return { ...source, name: editName.trim(), url: editUrl.trim() };
      }
      return source;
    });

    saveSources(updatedSources, `Source "${editName.trim()}" updated.`)
      .then(() => {
        // Exit edit mode only on successful save
        setEditingIndex(null);
        setEditName('');
        setEditUrl('');
      });
  };
  // ^^^ Handlers for editing ^^^


  // --- Render ---
  return (
    <div className="section">
      <h2>Sources Manager</h2>
      <p>Add, remove, and enable/disable filter list sources below.</p>

      {/* List existing sources */}
      {sources.length > 0 && (
        <div className="source-list">
          <div className="source-list-header">
            <span>Filter Sources</span>
            <span>{sources.length} Sources</span>
          </div>
          {sources.map((source, index) => (  // add index parameter here
            <div className="source-list-item" key={index}>
              <label className="toggle-switch">
                <input type="checkbox" checked={source.enabled} onChange={() => handleToggleEnabled(index)} />
                <span className="toggle-slider"></span>
              </label>
              <div className="source-list-content">
                <div className="source-name">{source.name}</div>
                <div className="source-url">{source.url}</div>
              </div>
              <div className="source-actions">
                <button className="source-action-btn secondary" onClick={() => handleStartEdit(index)}>Edit</button>
                <button className="source-action-btn secondary" onClick={() => handleRemoveSource(index)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {sources.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No Sources Found</div>
          <div className="empty-state-description">
            Add filter list sources to start building your blocklist.
          </div>
          <button onClick={() => {
            document.getElementById('new-source-name')?.focus();
          }}>Add First Source</button>
        </div>
      )}

      {/* Add new source form (existing code) */}
      <div className="setting-item" style={{ marginBottom: '1.5rem' }}>
        <h3>Add New Source</h3>
        <div>
          <label htmlFor="new-source-name">Name:</label>
          <input
            type="text"
            id="new-source-name"
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            placeholder="e.g., EasyList"
          />
        </div>
        <div>
          <label htmlFor="new-source-url">URL:</label>
          <input
            type="url"
            id="new-source-url"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            placeholder="https://easylist.to/easylist/easylist.txt"
          />
        </div>
        <button onClick={handleAddSource} disabled={!newSourceName || !newSourceUrl}>Add Source</button>
      </div>
    </div>
  );
};
// --- End SourcesManager Component ---


// --- CustomRulesEditor Component ---
const CustomRulesEditor = () => {
  const [rules, setRules] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load custom rules on mount
  useEffect(() => {
    let isMounted = true;
    const loadRules = async () => {
      setError(null);
      setSaveStatus('idle');
      setIsLoading(true);
      try {
        const loadedRules = await window.electronAPI.getCustomRules();
        if (isMounted) {
          setRules(loadedRules || ''); // Handle null/undefined
        }
      } catch (err) {
        console.error("Failed to load custom rules:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load custom rules.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false); // Set loading false after load attempt
        }
      }
    };
    loadRules();
    return () => { isMounted = false; };
  }, []); // Empty dependency array means run once on mount

  // Add handler to save custom rules
  const handleSaveCustomRules = async () => {
    setError(null);
    setSaveStatus('saving');
    try {
      const result = await window.electronAPI.saveCustomRules(rules);
      if (result.success) {
        setSaveStatus('success');
        // Optionally clear success message after a delay
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error(result.error || "Unknown error saving custom rules");
      }
    } catch (err) {
      console.error("Failed to save custom rules:", err);
      setError(err instanceof Error ? err.message : "Failed to save custom rules.");
      setSaveStatus('error');
    }
  };

  return (
    <div className="section">
      <h2>Custom Rules</h2>
      <p>Enter custom filter rules below (one per line).</p>
      <ul style={{ marginBottom: '1rem' }}>
        <li>For blocking rules, use: <code>||example.com^</code></li>
        <li>For exception rules, use: <code>@@||example.com^</code> (note the <code>@@</code> prefix)</li>
      </ul>
      {isLoading && <p>Loading...</p>}
      {/* Display loading error */}
      {!isLoading && error && saveStatus !== 'saving' && <p style={{ color: 'red' }}>Error: {error}</p>}
      <textarea
        placeholder="||example.com^ ← blocking rule
@@||example.com/ads^ ← exception rule"
        value={rules}
        onChange={(e) => {
          setRules(e.target.value);
          // Reset save status if user types after save/error
          if (saveStatus === 'success' || saveStatus === 'error') {
            setSaveStatus('idle');
            setError(null); // Clear error on type
          }
        }}
        style={{ width: '100%', minHeight: '150px', fontFamily: 'monospace' }}
        disabled={isLoading || saveStatus === 'saving'} // Disable during initial load or save
      />
      {/* Save button div */}
      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={handleSaveCustomRules} disabled={isLoading || saveStatus === 'saving'}>
          {saveStatus === 'saving' ? 'Saving...' : 'Save Custom Rules'}
        </button>
        {saveStatus === 'success' && <span style={{ color: 'green' }}>✅ Saved!</span>}
        {saveStatus === 'error' && <span style={{ color: 'red' }}>❌ Save failed: {error}</span>}
      </div>
    </div>
  );
};
// --- End CustomRulesEditor Component ---

// --- CustomTooltip Component ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div className="tooltip-item" key={`item-${index}`}>
          <div 
            className="tooltip-color" 
            style={{ backgroundColor: entry.color }} 
          />
          <span className="tooltip-name">{entry.name}:</span>
          <span className="tooltip-value">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};
// --- End CustomTooltip Component ---

// --- ProcessingControls Component ---
// Remove the duplicate ProcessingResult interface definition and use the imported one
const ProcessingControls = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null);
  const [progress, setProgress] = useState<{
    status: string;
    percent: number;
  } | null>(null);
  const [dashboardStats, setDashboardStats] = useState<{
    enabledSources: number;
    totalSources: number;
    customRulesCount: number;
    lastProcessedTime: string | null;
  }>({
    enabledSources: 0,
    totalSources: 0,
    customRulesCount: 0,
    lastProcessedTime: null
  });

  // Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get current sources
        const sources = await window.electronAPI.getSources();
        const enabledSources = sources.filter(s => s.enabled).length;
        
        // Get custom rules
        const customRules = await window.electronAPI.getCustomRules();
        const customRulesCount = customRules.split('\n')
          .filter(line => line.trim() && !line.trim().startsWith('#')).length;
          
        // Get last process time
        const lastProcessTime = await window.electronAPI.getLastProcessTime();
        
        setDashboardStats({
          enabledSources,
          totalSources: sources.length,
          customRulesCount,
          lastProcessedTime: lastProcessTime
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      }
    };
    
    loadStats();
  }, []);

  // Listen for progress updates
  useEffect(() => {
    const onProgressUpdate = (data: { status: string; percent: number }) => {
      setProgress(data);
    };
    
    window.electronAPI.onProcessProgress(onProgressUpdate);
    
    return () => {
      window.electronAPI.removeProcessProgressListener();
    };
  }, []);

  const handleRunProcess = async () => {
    setIsLoading(true);
    setError(null);
    setLastResult(null);
    setProgress({ status: 'Initializing process...', percent: 0 });
    
    try {
      const result = await window.electronAPI.runImportProcess();
      setLastResult(result);
      
      // Refresh dashboard stats after processing
      const sources = await window.electronAPI.getSources();
      const lastProcessTime = await window.electronAPI.getLastProcessTime();
      setDashboardStats(prev => ({
        ...prev,
        enabledSources: sources.filter(s => s.enabled).length,
        totalSources: sources.length,
        lastProcessedTime: lastProcessTime
      }));
      
      if (!result.success) {
        setError(result.error || "An unknown error occurred during processing.");
      }
    } catch (err) {
      console.error('Error running process:', err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="section">
      <div className="process-header">
        <h2>Blockingmachine Filter Processor</h2>
        <p>
          Combine, deduplicate, and optimize filter lists from your configured sources.
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-icon">📋</div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-value">{dashboardStats.enabledSources}/{dashboardStats.totalSources}</span>
            <span className="dashboard-stat-label">Active Sources</span>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="dashboard-icon">✏️</div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-value">{dashboardStats.customRulesCount}</span>
            <span className="dashboard-stat-label">Custom Rules</span>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="dashboard-icon">🕒</div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-value">{dashboardStats.lastProcessedTime ? 'Last Run' : 'Never Run'}</span>
            <span className="dashboard-stat-label">{dashboardStats.lastProcessedTime || 'Run your first process'}</span>
          </div>
        </div>
      </div>

      {/* Last processed info if available */}
      {dashboardStats.lastProcessedTime && (
        <div className="last-processed-card">
          <div className="last-processed-title">Last Processing Time</div>
          <div className="last-processed-time">{dashboardStats.lastProcessedTime}</div>
        </div>
      )}

      <div className="process-card">
        <div className="card-content">
          <h3>Run Processing</h3>
          <p>
            Download sources, parse rules, and generate optimized filter lists.
            This process may take several seconds depending on the number of enabled sources.
          </p>
          
          <button 
            onClick={handleRunProcess} 
            disabled={isLoading}
            className="process-button"
          >
            {isLoading ? (
              <span className="loading-spinner">
                <span className="spinner-icon">⟳</span> Processing...
              </span>
            ) : (
              'Generate Filter Lists'
            )}
          </button>
          
          {isLoading && progress && (
            <div className="progress-container">
              <div className="progress-status">{progress.status}</div>
              <div className="progress-bar-outer">
                <div 
                  className="progress-bar-inner" 
                  style={{ width: `${progress.percent}%` }}
                ></div>
              </div>
              <div className="progress-percent">{progress.percent}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Results Card */}
      {lastResult && (
        <div className={`process-card results-card ${lastResult.success ? 'success' : 'error'}`}>
          <div className="card-header">
            <h3>
              {lastResult.success ? (
                <span className="success-icon">✅ Processing Results</span>
              ) : (
                <span className="error-icon">❌ Processing Failed</span>
              )}
            </h3>
            <span className="timestamp">{lastResult.timestamp || 'N/A'}</span>
          </div>
          <div className="card-content">
            {lastResult.success ? (
              <>
                {/* Summary Cards with Key Metrics */}
                <div className="summary-cards">
                  <div className="summary-card">
                    <div className="summary-card-header">
                      <h4 className="summary-card-title">Total Rules</h4>
                    </div>
                    <div className="summary-card-value">
                      {lastResult.processedRuleCount?.toLocaleString() ?? 'N/A'}
                    </div>
                    <div className="summary-card-footer">
                      Rules processed from all sources
                    </div>
                  </div>
                  
                  <div className="summary-card">
                    <div className="summary-card-header">
                      <h4 className="summary-card-title">Unique Rules</h4>
                    </div>
                    <div className="summary-card-value">
                      {lastResult.uniqueRuleCount?.toLocaleString() ?? 'N/A'}
                    </div>
                    <div className="summary-card-footer">
                      {lastResult.processedRuleCount > 0 ? (
                        `${((1 - lastResult.uniqueRuleCount / lastResult.processedRuleCount) * 100).toFixed(1)}% deduplication rate`
                      ) : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Blocking Rules</span>
                    <span className="stat-value">
                      {(lastResult.uniqueRuleCount - (lastResult.exceptionRuleCount || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Exception Rules</span>
                    <span className="stat-value">{lastResult.exceptionRuleCount?.toLocaleString() ?? 'N/A'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Deduplication Rate</span>
                    <span className="stat-value">
                      {lastResult.processedRuleCount > 0 
                        ? ((1 - lastResult.uniqueRuleCount / lastResult.processedRuleCount) * 100).toFixed(2) + '%'
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                
                {/* Chart using Recharts */}
                <div className="comparison-chart">
                  <h3>Rule Distribution</h3>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { 
                              name: 'Blocking Rules', 
                              value: lastResult.uniqueRuleCount - (lastResult.exceptionRuleCount || 0) 
                            },
                            { 
                              name: 'Exception Rules', 
                              value: lastResult.exceptionRuleCount || 0 
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#4CAF50" />
                          <Cell fill="#FFA726" />
                        </Pie>
                        <Legend />
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Bar Chart for filter stats */}
                <div className="comparison-chart">
                  <h3>Filter Stats Comparison</h3>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          {
                            name: 'Rules',
                            Processed: lastResult.processedRuleCount,
                            Unique: lastResult.uniqueRuleCount,
                            Exceptions: lastResult.exceptionRuleCount || 0,
                            Blocking: lastResult.uniqueRuleCount - (lastResult.exceptionRuleCount || 0)
                          }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="Processed" fill="#8884d8" />
                        <Bar dataKey="Unique" fill="#82ca9d" />
                        <Bar dataKey="Blocking" fill="#4CAF50" />
                        <Bar dataKey="Exceptions" fill="#FFA726" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="error-message">
                {lastResult.error || 'Unknown error'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Display specific error if lastResult is null but error exists (e.g., IPC call failed) */}
      {!lastResult && error && (
         <div className="process-card error-card">
          <div className="card-content">
            <h3 className="error-icon">❌ Error</h3>
            <p>{error}</p>
          </div>
         </div>
      )}
    </div>
  );
};
// --- End ProcessingControls Component ---

// --- Main App Component ---
function App() {
  const [currentView, setCurrentView] = useState('process');
  const [selectedTheme, setSelectedTheme] = useState<Theme>('system');
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sources, setSources] = useState<FilterSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true); // Specific loading for sources
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccessMessage, setGlobalSuccessMessage] = useState<string | null>(null);

  // Memoize applyTheme (existing)
  const memoizedApplyTheme = useCallback(applyTheme, []);

  // Load and apply theme (existing)
  useEffect(() => {
    let isMounted = true;
    const loadAndApplyTheme = async () => {
      try {
        const storedTheme = await window.electronAPI.getTheme();
        if (isMounted) {
          setSelectedTheme(storedTheme);
          memoizedApplyTheme(storedTheme); // Apply the loaded theme
        }
      } catch (error) {
        console.error("Failed to load theme setting on launch:", error);
        // Apply default system theme as fallback
        if (isMounted) {
          memoizedApplyTheme('system');
        }
      } finally {
        if (isMounted) {
          setIsThemeLoading(false);
        }
      }
    };
    loadAndApplyTheme();
    return () => { isMounted = false; };
  }, [memoizedApplyTheme]); // Depend on memoized function

  // Listener for system theme changes (existing)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      // Only re-apply if the current setting is 'system'
      if (selectedTheme === 'system') {
        memoizedApplyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    // Initial check in case the system theme changed while the app was closed
    handleSystemChange();

    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [selectedTheme, memoizedApplyTheme]); // Re-run if selectedTheme or apply function changes

  // Handler to change theme (existing)
  const handleThemeChange = useCallback(async (newTheme: Theme) => {
    setSelectedTheme(newTheme);
    memoizedApplyTheme(newTheme); // Apply theme immediately
    try {
      await window.electronAPI.setTheme(newTheme);
    } catch (error) {
      console.error("Failed to save theme setting:", error);
      // Optionally revert state or show error message
    }
  }, [memoizedApplyTheme]); // Depend on memoized function

  // vvv Load sources on mount (moved from SourcesManager) vvv
  useEffect(() => {
    let isMounted = true;
    const loadSources = async () => {
      setGlobalError(null); // Clear previous errors
      setIsLoadingSources(true);
      try {
        const loadedSources = await window.electronAPI.getSources();
        if (isMounted) {
          setSources(loadedSources || []); // Handle null/undefined case
        }
      } catch (err) {
        console.error("Failed to load sources:", err);
        if (isMounted) {
          setGlobalError(err instanceof Error ? err.message : "Failed to load sources.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingSources(false);
        }
      }
    };
    loadSources();
    return () => { isMounted = false; }; // Cleanup on unmount
  }, []);
  // ^^^ Load sources on mount ^^^

  // vvv Clear global success/error messages after a delay vvv
  useEffect(() => {
    if (globalSuccessMessage || globalError) {
      const timer = setTimeout(() => {
        setGlobalSuccessMessage(null);
        setGlobalError(null);
      }, 3000); // Clear after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [globalSuccessMessage, globalError]);
  // ^^^ Clear global messages ^^^

  // vvv Save sources function (moved from SourcesManager) vvv
  const saveSources = useCallback(async (updatedSources: FilterSource[], successMsg?: string) => {
    // Reset messages before attempting save
    setGlobalError(null);
    setGlobalSuccessMessage(null);
    try {
      const result = await window.electronAPI.saveSources(updatedSources);
      if (!result.success) {
        throw new Error(result.error || "Unknown error saving sources");
      }
      setSources(updatedSources); // Update global state on successful save
      if (successMsg) {
        setGlobalSuccessMessage(successMsg);
      }
    } catch (err) {
      console.error("Failed to save sources:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to save sources.";
      setGlobalError(errorMsg);
      // Re-throw the error so calling components know the save failed
      throw err;
    }
  }, []); // Empty dependency array
  // ^^^ Save sources function ^^^

  // ResizeObserver Effect (existing)
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return; // Exit if ref is not attached yet

    let resizeTimeout: NodeJS.Timeout | null = null;

    const observer = new ResizeObserver(entries => {
      // We only observe one element, so entries[0] is fine
      if (!entries || entries.length === 0) return;

      // Use contentRect for size excluding padding/border if needed,
      // or boundingBoxRect for overall size. Let's stick with offsetWidth/Height for now.
      const width = containerElement.offsetWidth;
      const height = containerElement.offsetHeight;

      // Clear previous timeout
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      // Debounce the notification to main process
      resizeTimeout = setTimeout(() => {
        window.electronAPI.notifyResize(width, height);
      }, 250);
    });

    // Start observing the container element
    observer.observe(containerElement);

    // Cleanup function: disconnect the observer when component unmounts
    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout); // Clear pending timeout on unmount
      }
      observer.disconnect();
    };

  }, [isThemeLoading]); // Re-run only when theme loading finishes (initial setup)
  // ^^^ ResizeObserver Effect ^^^

  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  // Listen for update events
  useEffect(() => {
    window.electronAPI.onUpdateStatus((status) => {
      setUpdateStatus(status);
      if (status.includes('Update available')) {
        setUpdateAvailable(true);
      }
    });
    
    window.electronAPI.onUpdateProgress((progress) => {
      setUpdateProgress(progress);
    });
    
    window.electronAPI.onUpdateDownloaded(() => {
      setUpdateStatus('Update downloaded. Ready to install.');
    });
  }, []);

  if (isThemeLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container" ref={containerRef}>
      <h1>Blockingmachine</h1>
      <nav className="app-navigation">
        <button 
          className={`nav-button ${currentView === 'process' ? 'active' : ''}`} 
          onClick={() => setCurrentView('process')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Process</span>
        </button>
        <button 
          className={`nav-button ${currentView === 'sources' ? 'active' : ''}`} 
          onClick={() => setCurrentView('sources')}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-text">Sources</span>
        </button>
        <button 
          className={`nav-button ${currentView === 'bulkImport' ? 'active' : ''}`} 
          onClick={() => setCurrentView('bulkImport')}
        >
          <span className="nav-icon">📥</span>
          <span className="nav-text">Bulk Import</span>
        </button>
        <button 
          className={`nav-button ${currentView === 'custom' ? 'active' : ''}`} 
          onClick={() => setCurrentView('custom')}
        >
          <span className="nav-icon">✏️</span>
          <span className="nav-text">Custom Rules</span>
        </button>
        <button 
          className={`nav-button ${currentView === 'settings' ? 'active' : ''}`} 
          onClick={() => setCurrentView('settings')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Settings</span>
        </button>
      </nav>

      {/* Global Feedback Area */}
      <div className={`feedback-container ${globalError ? 'error' : globalSuccessMessage ? 'success' : ''}`}>
        {globalError && (
          <div className="feedback-message error-feedback">
            <span className="feedback-icon">❌</span>
            <span className="feedback-text">{globalError}</span>
          </div>
        )}
        {globalSuccessMessage && !globalError && (
          <div className="feedback-message success-feedback">
            <span className="feedback-icon">✅</span>
            <span className="feedback-text">{globalSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Render current view */}
      <div className="main-content"> {/* Wrap views for potential flex layout */}
        {currentView === 'sources' && (
          isLoadingSources ? <p>Loading sources...</p> :
          <SourcesManager
            sources={sources}
            saveSources={saveSources}
            setError={setGlobalError}
            setSuccessMessage={setGlobalSuccessMessage}
          />
        )}
        {/* vvv Render BulkImportManager vvv */}
        {currentView === 'bulkImport' && (
           <BulkImportManager
             currentSources={sources}
             saveSources={saveSources}
             setError={setGlobalError}
             setSuccessMessage={setGlobalSuccessMessage}
           />
        )}
        {/* ^^^ Render BulkImportManager ^^^ */}
        {currentView === 'custom' && <CustomRulesEditor />}
        {currentView === 'process' && <ProcessingControls />}
        {currentView === 'settings' && (
          <Settings
            currentTheme={selectedTheme}
            onThemeChange={handleThemeChange}
          />
        )}
      </div>

      {/* vvv Update Footer vvv */}
      <footer className="app-footer">
        Made with ❤️ by Daniel Hipskind
        {updateStatus && (
          <span style={{ marginLeft: '20px', fontSize: '11px' }}>
            {updateStatus}
            {updateAvailable && (
              <button 
                onClick={() => window.electronAPI.installUpdate()}
                style={{ marginLeft: '5px', padding: '0px 5px', fontSize: '10px' }}
              >
                Install
              </button>
            )}
          </span>
        )}
      </footer>
      {/* ^^^ Update Footer ^^^ */}

    </div> // End of container div
  );
}

export default App;