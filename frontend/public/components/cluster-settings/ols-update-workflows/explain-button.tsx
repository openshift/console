import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { MagicIcon } from '@patternfly/react-icons';
import type { Extension } from '@console/dynamic-plugin-sdk/src/types';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import type { ClusterVersionKind, ClusterOperator } from '../../../module/k8s';
import type { UpdateWorkflowPhase, OLSAttachment } from './types';
import {
  generateUpdatePrompt,
  createUpdateAttachments,
  getUpdateButtonText,
} from './workflow-utils';

// See https://github.com/openshift/lightspeed-console/blob/701992fe94c7f8cb97cedddc642788c369e7af7e/src/types.ts#L14-L24
type OpenOLSCallback = (
  prompt: string,
  attachments: OLSAttachment[],
  enableHistory: boolean,
  enableFeedback: boolean,
) => void;

type UseOpenOLS = () => OpenOLSCallback | null;

type OLSButtonInnerProps = { useOpenOLS: UseOpenOLS };

interface UpdateWorkflowOLSButtonProps {
  phase: UpdateWorkflowPhase;
  cv: ClusterVersionKind;
  clusterOperators?: ClusterOperator[];
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
  targetVersion,
  className,
  onClick,
  variant = 'link',
  size = 'sm',
  'data-test': dataTest,
  useOpenOLS,
}) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  // Always call the hook since we're guaranteed it exists
  const openOLS = useOpenOLS();

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

    // Generate prompt and attachments
    const prompt = generateUpdatePrompt(phase, cv, t, clusterOperators, targetVersion);
    const attachments = createUpdateAttachments(phase, cv, t, clusterOperators);

    // Open OLS with prompt and attachments
    openOLS(prompt, attachments, true, true);
  }, [openOLS, fireTelemetryEvent, onClick, phase, cv, t, clusterOperators, targetVersion]);

  // Get button text for this phase from workflow configuration
  const buttonContent = useMemo(() => getUpdateButtonText(phase, t), [phase, t]);

  // If the hook didn't return a function, don't render
  if (!openOLS) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      icon={<MagicIcon />}
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

// Type guard for OpenShift Lightspeed open handler extensions
// See https://github.com/openshift/lightspeed-console/tree/main#example
const isOpenOLSHandlerExtension = (e: Extension): e is OpenOLSHandlerExtension =>
  e.type === 'console.action/provider' && e.properties?.contextId === 'ols-open-handler';

export const UpdateWorkflowOLSButton: FC<UpdateWorkflowOLSButtonProps> = (props) => {
  const isOLSAvailable = useFlag('LIGHTSPEED_CONSOLE');

  // Find the OLS extension using useResolvedExtensions - always call hooks at top level
  const [extensions, resolved] = useResolvedExtensions(isOpenOLSHandlerExtension);

  // Get the hook from the extension (should only be one)
  const useOpenOLS: UseOpenOLS | undefined = resolved
    ? (extensions[0]?.properties?.provider as UseOpenOLS)
    : undefined;

  // Early return if conditions aren't met, but hooks have been called consistently
  if (!isOLSAvailable || !resolved || !useOpenOLS) {
    return null;
  }

  // Now render the inner component that will consistently call the hook
  return <OLSButtonInner {...props} useOpenOLS={useOpenOLS} />;
};
