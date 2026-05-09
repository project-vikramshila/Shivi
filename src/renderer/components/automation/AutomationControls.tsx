import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface AutomationControlsProps {
  className?: string;
}

interface StatusIndicatorProps {
  enabled: boolean;
  executing: boolean;
}

interface ControlButtonProps {
  variant: string;
}

interface ConfigValueProps {
  enabled?: boolean;
}

interface PermissionButtonProps {
  active: boolean;
}

const AutomationControls: React.FC<AutomationControlsProps> = ({ className }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    loadStatus();
    loadConfig();
    loadLogs();
  }, []);

  const loadStatus = async () => {
    try {
      if (!(window as any).shiviApi?.automation) {
        console.warn('Shivi API automation not available');
        return;
      }
      const statusData = await (window as any).shiviApi.automation.getStatus();
      setStatus(statusData);
      setIsEnabled(statusData.enabled);
      setIsExecuting(statusData.executing);
    } catch (error) {
      console.error('Failed to load automation status:', error);
    }
  };

  const loadConfig = async () => {
    try {
      if (!(window as any).shiviApi?.automation) {
        console.warn('Shivi API automation not available');
        return;
      }
      const configData = await (window as any).shiviApi.automation.getConfig();
      setConfig(configData);
    } catch (error) {
      console.error('Failed to load automation config:', error);
    }
  };

  const loadLogs = async () => {
    try {
      if (!(window as any).shiviApi?.automation) {
        console.warn('Shivi API automation not available');
        return;
      }
      const logsData = await (window as any).shiviApi.automation.getLogs();
      setLogs(logsData.slice(-10)); // Show last 10 logs
    } catch (error) {
      console.error('Failed to load automation logs:', error);
    }
  };

  const toggleAutomation = async () => {
    try {
      if (!(window as any).shiviApi?.automation) {
        console.warn('Shivi API automation not available');
        return;
      }
      if (isEnabled) {
        await (window as any).shiviApi.automation.disable();
        setIsEnabled(false);
      } else {
        await (window as any).shiviApi.automation.enable();
        setIsEnabled(true);
      }
      await loadStatus();
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    }
  };

  const emergencyStop = async () => {
    try {
      if (!(window as any).shiviApi?.automation) {
        console.warn('Shivi API automation not available');
        return;
      }
      await (window as any).shiviApi.automation.emergencyStop();
      setIsExecuting(false);
      await loadStatus();
      await loadLogs();
    } catch (error) {
      console.error('Failed to trigger emergency stop:', error);
    }
  };

  const clearLogs = async () => {
    try {
      if (!(window as any).shiviApi?.automation) {
        console.warn('Shivi API automation not available');
        return;
      }
      await (window as any).shiviApi.automation.clearLogs();
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const grantPermission = async (appName: string, level: string) => {
    try {
      if (!(window as any).shiviApi?.automation) {
        console.warn('Shivi API automation not available');
        return;
      }
      await (window as any).shiviApi.automation.grantPermission(appName, level);
      await loadConfig();
    } catch (error) {
      console.error('Failed to grant permission:', error);
    }
  };

  return (
    <Container className={className}>
      <Header>
        <Title>🤖 Automation Control</Title>
        <StatusIndicator enabled={isEnabled} executing={isExecuting}>
          {isExecuting ? '⚡ Executing' : isEnabled ? '✅ Enabled' : '❌ Disabled'}
        </StatusIndicator>
      </Header>

      <Controls>
        <ControlButton
          onClick={toggleAutomation}
          disabled={isExecuting}
          variant={isEnabled ? 'danger' : 'success'}
        >
          {isEnabled ? 'Disable Automation' : 'Enable Automation'}
        </ControlButton>

        <ControlButton
          onClick={emergencyStop}
          disabled={!isExecuting}
          variant="danger"
        >
          🚨 Emergency Stop
        </ControlButton>

        <ControlButton onClick={clearLogs} variant="secondary">
          Clear Logs
        </ControlButton>
      </Controls>

      {config && (
        <ConfigSection>
          <ConfigTitle>Configuration</ConfigTitle>
          <ConfigGrid>
            <ConfigItem>
              <ConfigLabel>Safe Mode:</ConfigLabel>
              <ConfigValue enabled={config.safeMode}>
                {config.safeMode ? 'On' : 'Off'}
              </ConfigValue>
            </ConfigItem>
            <ConfigItem>
              <ConfigLabel>Max Concurrent:</ConfigLabel>
              <ConfigValue>{config.maxConcurrentTasks}</ConfigValue>
            </ConfigItem>
            <ConfigItem>
              <ConfigLabel>Default Permission:</ConfigLabel>
              <ConfigValue>{config.defaultPermission}</ConfigValue>
            </ConfigItem>
            <ConfigItem>
              <ConfigLabel>Timeout:</ConfigLabel>
              <ConfigValue>{config.actionTimeout}ms</ConfigValue>
            </ConfigItem>
          </ConfigGrid>
        </ConfigSection>
      )}

      <PermissionsSection>
        <PermissionsTitle>App Permissions</PermissionsTitle>
        <PermissionsGrid>
          {['whatsapp', 'instagram', 'browser', 'gmail', 'calendar'].map(app => (
            <PermissionItem key={app}>
              <PermissionApp>{app}</PermissionApp>
              <PermissionButtons>
                <PermissionButton
                  onClick={() => grantPermission(app, 'read')}
                  active={config?.appPermissions?.[app] === 'read'}
                >
                  Read
                </PermissionButton>
                <PermissionButton
                  onClick={() => grantPermission(app, 'assist')}
                  active={config?.appPermissions?.[app] === 'assist'}
                >
                  Assist
                </PermissionButton>
                <PermissionButton
                  onClick={() => grantPermission(app, 'full')}
                  active={config?.appPermissions?.[app] === 'full'}
                >
                  Full
                </PermissionButton>
              </PermissionButtons>
            </PermissionItem>
          ))}
        </PermissionsGrid>
      </PermissionsSection>

      <LogsSection>
        <LogsTitle>Recent Activity</LogsTitle>
        <LogsContainer>
          {logs.length === 0 ? (
            <NoLogs>No automation activity yet</NoLogs>
          ) : (
            logs.map((log, index) => (
              <LogEntry key={index}>{log}</LogEntry>
            ))
          )}
        </LogsContainer>
      </LogsSection>
    </Container>
  );
};

const Container = styled.div`
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin: 10px 0;
  backdrop-filter: blur(10px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  color: #f1f5f9;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const StatusIndicator = styled.div<StatusIndicatorProps>`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props =>
    props.executing ? '#fbbf24' :
    props.enabled ? '#10b981' : '#ef4444'};
  color: ${props =>
    props.executing ? '#92400e' :
    props.enabled ? '#064e3b' : '#7f1d1d'};
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const ControlButton = styled.button<ControlButtonProps>`
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  background: ${props =>
    props.variant === 'success' ? '#10b981' :
    props.variant === 'danger' ? '#ef4444' :
    '#64748b'};
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfigSection = styled.div`
  margin-bottom: 20px;
`;

const ConfigTitle = styled.h4`
  color: #e2e8f0;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`;

const ConfigItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ConfigLabel = styled.span`
  color: #94a3b8;
  font-size: 13px;
`;

const ConfigValue = styled.span<ConfigValueProps>`
  color: ${props => props.enabled === false ? '#ef4444' : '#10b981'};
  font-size: 13px;
  font-weight: 500;
`;

const PermissionsSection = styled.div`
  margin-bottom: 20px;
`;

const PermissionsTitle = styled.h4`
  color: #e2e8f0;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
`;

const PermissionsGrid = styled.div`
  display: grid;
  gap: 8px;
`;

const PermissionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 6px;
`;

const PermissionApp = styled.span`
  color: #f1f5f9;
  font-size: 14px;
  text-transform: capitalize;
`;

const PermissionButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const PermissionButton = styled.button<PermissionButtonProps>`
  padding: 4px 8px;
  border: 1px solid ${props => props.active ? '#10b981' : '#64748b'};
  background: ${props => props.active ? 'rgba(16, 185, 129, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#10b981' : '#94a3b8'};
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #10b981;
    color: #10b981;
  }
`;

const LogsSection = styled.div``;

const LogsTitle = styled.h4`
  color: #e2e8f0;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
`;

const LogsContainer = styled.div`
  max-height: 200px;
  overflow-y: auto;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 6px;
  padding: 12px;
`;

const LogEntry = styled.div`
  color: #cbd5e1;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  margin-bottom: 4px;
  padding: 2px 0;

  &:last-child {
    margin-bottom: 0;
  }
`;

const NoLogs = styled.div`
  color: #64748b;
  font-size: 13px;
  text-align: center;
  padding: 20px;
`;

export default AutomationControls;