import type { FC } from 'react';
import { useCallback } from 'react';
import { Button } from '@patternfly/react-core';
import { RhUiAiInfoIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import type { Alert } from '@console/dynamic-plugin-sdk';
import type { Extension } from '@console/dynamic-plugin-sdk/src/types';
import type { ClusterVersionKind, ClusterOperator } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import {
  FEATURE_FLAG_LIGHTSPEED_PLUGIN,
  OLS_EXTENSION_TYPE,
  OLS_EXTENSION_CONTEXT_ID,
  OLS_SUBMIT_IMMEDIATELY,
  OLS_HIDE_PROMPT,
  OLS_NO_ATTACHMENTS,
} from './constants';
import type { UpdateWorkflowPhase, MachineConfigPool } from './types';
import { generateUpdatePrompt, getUpdateButtonText } from './workflow-utils';

/**
 * OLS Attachment type based on lightspeed-console plugin API
 * See https://github.com/openshift/lightspeed-console/blob/701992fe94c7f8cb97cedddc642788c369e7af7e/src/types.ts#L14-L24
 */
type OLSAttachment = {
  kind: string;
  name: string;
  contentType: string;
  content: string;
};

type OpenOLSCallback = (
  prompt: string,
  attachments: OLSAttachment[], // MCP tools fetch real-time cluster data, so we pass empty array
  enableHistory: boolean,
  enableFeedback: boolean,
) => void;

type UseOpenOLS = () => OpenOLSCallback | null;

type OLSButtonInnerProps = {
  openOLS: OpenOLSCallback | null;
};

interface UpdateWorkflowOLSButtonProps {
  phase: UpdateWorkflowPhase;
  cv: ClusterVersionKind;
  clusterOperators?: ClusterOperator[];
  machineConfigPools?: MachineConfigPool[];
  alerts?: Alert[];
  targetVersion?: string; // Optional target version for specific version analysis
  className?: string;
  onClick?: () => void;
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'danger'
    | 'warning'
    | 'link'
    | 'plain'
    | 'control';
  size?: 'sm' | 'lg';
  'data-test'?: string;
}

// Internal component that only renders when all conditions are met
const OLSButtonInner: FC<UpdateWorkflowOLSButtonProps & OLSButtonInnerProps> = ({
  phase,
  cv,
  clusterOperators,
  machineConfigPools,
  alerts,
  targetVersion,
  className,
  onClick,
  variant = 'link',
  size = 'sm',
  'data-test': dataTest,
  openOLS,
}) => {
  // CRITICAL: Call ALL hooks before any conditional returns
  const { t } = useTranslation('console-shared');
  const fireTelemetryEvent = useTelemetry();

  const handleClick = useCallback(() => {
    if (!openOLS) {
      return;
    }

    // Track usage by workflow phase
    fireTelemetryEvent('OLS Update Workflow Button Clicked', {
      source: 'cluster-settings',
      workflowPhase: phase,
      clusterVersion: cv.status?.desired?.version || 'unknown',
      updateChannel: cv.spec?.channel,
      clusterId: cv.spec?.clusterID,
    });

    // Call the optional onClick callback
    onClick?.();

    // Generate prompt - MCP tools will fetch real-time cluster data
    // Pass machineConfigPools and alerts when available for enhanced context
    const prompt = generateUpdatePrompt(
      phase,
      cv,
      t,
      clusterOperators,
      machineConfigPools,
      alerts,
      targetVersion,
    );

    // Open OLS with prompt - MCP uses tools to fetch live cluster data
    openOLS(prompt, OLS_NO_ATTACHMENTS, OLS_SUBMIT_IMMEDIATELY, OLS_HIDE_PROMPT);
  }, [
    openOLS,
    fireTelemetryEvent,
    onClick,
    phase,
    cv,
    t,
    clusterOperators,
    machineConfigPools,
    alerts,
    targetVersion,
  ]);

  // Get button text for this phase from workflow configuration
  const buttonContent = getUpdateButtonText(phase, t);

  // Early return AFTER all hooks have been called
  if (!openOLS) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      icon={<RhUiAiInfoIcon />}
      iconPosition="start"
      className={className}
      data-test={dataTest || `ols-update-${phase}`}
    >
      {buttonContent}
    </Button>
  );
};

type OpenOLSHandlerExtension = Extension<
  'console.action/provider',
  {
    contextId: string;
    provider: UseOpenOLS;
  }
>;

// Component that calls the OLS hook - separated to ensure hooks are called consistently
const OLSButtonWithHook: FC<UpdateWorkflowOLSButtonProps & { useOpenOLS: UseOpenOLS }> = ({
  useOpenOLS,
  ...props
}) => {
  // Call the hook unconditionally - this component only renders when hook is available
  const openOLS = useOpenOLS();

  // Pass to the inner button component
  return <OLSButtonInner {...props} openOLS={openOLS} />;
};

export const UpdateWorkflowOLSButton: FC<UpdateWorkflowOLSButtonProps> = (props) => {
  // CRITICAL: All hooks must be called unconditionally at the top level
  const isOLSAvailable = useFlag(FEATURE_FLAG_LIGHTSPEED_PLUGIN);

  // Find the OLS extension using useResolvedExtensions - always call hooks at top level
  // Type guard inlined since it's only used here
  // See https://github.com/openshift/lightspeed-console/tree/main#example
  const [extensions, resolved] = useResolvedExtensions<OpenOLSHandlerExtension>(
    (e: Extension): e is OpenOLSHandlerExtension =>
      e.type === OLS_EXTENSION_TYPE && e.properties?.contextId === OLS_EXTENSION_CONTEXT_ID,
  );

  // Early return after calling all hooks
  if (!isOLSAvailable || !resolved || !extensions[0]?.properties?.provider) {
    return null;
  }

  // Type assertion is safe here because the extension system guarantees the provider is resolved
  const useOpenOLS = extensions[0].properties.provider as UseOpenOLS;

  // Render the component that will call the hook
  return <OLSButtonWithHook {...props} useOpenOLS={useOpenOLS} />;
};
