import { useLayoutStore } from '@/stores/layoutStore';
import { FileExplorer } from '@/components/fileExplorer/FileExplorer';
import {
  VscFiles,
  VscSearch,
  VscSettingsGear,
} from 'react-icons/vsc';
import './Sidebar.css';

export function Sidebar() {
  const { sidebarVisible, activeSidebarTab, setActiveSidebarTab } = useLayoutStore();

  if (!sidebarVisible) return null;

  return (
    <div className="sidebar">
      <div className="sidebar-activity-bar">
        <button
          className={`activity-btn ${activeSidebarTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveSidebarTab('files')}
          title="Explorer"
        >
          <VscFiles size={24} />
        </button>
        <button
          className={`activity-btn ${activeSidebarTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveSidebarTab('search')}
          title="Search"
        >
          <VscSearch size={24} />
        </button>
        <div className="activity-spacer" />
        <button
          className={`activity-btn ${activeSidebarTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSidebarTab('settings')}
          title="Settings"
        >
          <VscSettingsGear size={24} />
        </button>
      </div>
      <div className="sidebar-content">
        {activeSidebarTab === 'files' && <FileExplorer />}
        {activeSidebarTab === 'search' && (
          <div className="sidebar-placeholder">
            <VscSearch size={32} />
            <p>Search</p>
            <span>Coming soon</span>
          </div>
        )}
        {activeSidebarTab === 'settings' && (
          <div className="sidebar-placeholder">
            <VscSettingsGear size={32} />
            <p>Settings</p>
            <span>Coming soon</span>
          </div>
        )}
      </div>
    </div>
  );
}