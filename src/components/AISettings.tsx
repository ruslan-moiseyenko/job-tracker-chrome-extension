// AI Settings component for managing Gemini API key and AI preferences
import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { COLORS, SHADOWS } from "../constants/colors";
import { AIService } from "../services/ai-service";

const SettingsContainer = styled.div`
  background: ${COLORS.BACKGROUND_PRIMARY};
  border: 2px solid ${COLORS.INPUT_BORDER};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: ${SHADOWS.DROPDOWN};
`;

const SettingsHeader = styled.h3`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.TEXT_PRIMARY};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SettingsRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${COLORS.GRAY_700};
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${COLORS.INPUT_BORDER};
  border-radius: 6px;
  font-size: 12px;
  background: ${COLORS.BACKGROUND_PRIMARY};
  color: ${COLORS.TEXT_PRIMARY};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${COLORS.INPUT_BORDER_FOCUS};
    box-shadow: ${SHADOWS.INPUT_FOCUS_PRIMARY};
  }

  &::placeholder {
    color: ${COLORS.GRAY_400};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: ${COLORS.PRIMARY};
          color: ${COLORS.TEXT_WHITE};
          &:hover:not(:disabled) {
            background: ${COLORS.PRIMARY_HOVER};
          }
        `;
      case 'danger':
        return `
          background: ${COLORS.ERROR};
          color: ${COLORS.TEXT_WHITE};
          &:hover:not(:disabled) {
            background: #dc2626;
          }
        `;
      default:
        return `
          background: ${COLORS.GRAY_200};
          color: ${COLORS.GRAY_700};
          &:hover:not(:disabled) {
            background: ${COLORS.GRAY_300};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusIndicator = styled.div<{ status: 'ready' | 'error' | 'loading' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 8px;

  ${props => {
    switch (props.status) {
      case 'ready':
        return `
          background: ${COLORS.SUCCESS_BG};
          color: ${COLORS.SUCCESS_TEXT};
        `;
      case 'error':
        return `
          background: ${COLORS.ERROR_BG};
          color: ${COLORS.ERROR_TEXT};
        `;
      default:
        return `
          background: ${COLORS.INFO_BG};
          color: ${COLORS.INFO_TEXT};
        `;
    }
  }}
`;

const HelpText = styled.div`
  font-size: 10px;
  color: ${COLORS.GRAY_500};
  margin-top: 4px;
  line-height: 1.4;

  a {
    color: ${COLORS.PRIMARY};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

interface AISettingsProps {
  onClose?: () => void;
}

export default function AISettings({ onClose }: AISettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [currentStatus, setCurrentStatus] = useState<'ready' | 'error' | 'loading'>('loading');
  const [statusMessage, setStatusMessage] = useState("Checking API key...");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkCurrentStatus();
  }, []);

  const checkCurrentStatus = async () => {
    const status = await AIService.getApiKeyStatus();
    if (status.hasKey && status.isInitialized) {
      setCurrentStatus('ready');
      setStatusMessage('AI service is ready');
    } else if (status.hasKey) {
      setCurrentStatus('loading');
      setStatusMessage('API key found, initializing...');
      // Try to initialize
      const initSuccess = await AIService.initialize();
      if (initSuccess) {
        setCurrentStatus('ready');
        setStatusMessage('AI service is ready');
      } else {
        setCurrentStatus('error');
        setStatusMessage('Invalid API key or initialization failed');
      }
    } else {
      setCurrentStatus('error');
      setStatusMessage('No API key configured');
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setCurrentStatus('error');
      setStatusMessage('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    setCurrentStatus('loading');
    setStatusMessage('Validating API key...');

    const success = await AIService.setApiKey(apiKey.trim());
    
    if (success) {
      setCurrentStatus('ready');
      setStatusMessage('API key saved and validated successfully');
      setApiKey('');
    } else {
      setCurrentStatus('error');
      setStatusMessage('Failed to validate API key. Please check if it\'s correct.');
    }
    
    setIsLoading(false);
  };

  const handleClearApiKey = async () => {
    setIsLoading(true);
    try {
      await chrome.storage.local.remove(['geminiApiKey']);
      setCurrentStatus('error');
      setStatusMessage('API key removed');
      setApiKey('');
    } catch (error) {
      console.error('Failed to clear API key:', error);
    }
    setIsLoading(false);
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'ready': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <SettingsContainer>
      <SettingsHeader>
        🤖 AI Settings
      </SettingsHeader>

      <SettingsRow>
        <Label>Google Gemini API Key</Label>
        <Input
          type="password"
          placeholder="Enter your Gemini API key..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={isLoading}
        />
        <HelpText>
          Get your free API key from{' '}
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Google AI Studio
          </a>
          . This key is stored locally and never shared.
        </HelpText>
      </SettingsRow>

      <StatusIndicator status={currentStatus}>
        <span>{getStatusIcon()}</span>
        <span>{statusMessage}</span>
      </StatusIndicator>

      <ButtonGroup>
        {onClose && (
          <Button onClick={onClose} disabled={isLoading}>
            Close
          </Button>
        )}
        {currentStatus === 'ready' && (
          <Button 
            variant="danger" 
            onClick={handleClearApiKey}
            disabled={isLoading}
          >
            Clear Key
          </Button>
        )}
        <Button 
          variant="primary" 
          onClick={handleSaveApiKey}
          disabled={isLoading || !apiKey.trim()}
        >
          {isLoading ? 'Validating...' : 'Save Key'}
        </Button>
      </ButtonGroup>
    </SettingsContainer>
  );
}