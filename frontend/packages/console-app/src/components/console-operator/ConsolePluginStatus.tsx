import type { FC } from 'react';
import { useMemo } from 'react';
import type { PluginInfoEntry } from '@openshift/dynamic-plugin-sdk';
import { Button } from '@patternfly/react-core';
import { RhUiEditIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import type { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { useAccessReview } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { LazyConsolePluginModalOverlay } from '@console/shared/src/components/modals/LazyConsolePluginModal';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared/src/components/status/icons';
import { Status } from '@console/shared/src/components/status/Status';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src/constants/resource';

export const developmentMode = window.SERVER_FLAGS.k8sMode === 'off-cluster';

export const useConsoleOperatorConfigData = () => {
  const console: WatchK8sResource = {
    kind: referenceForModel(ConsoleOperatorConfigModel),
    isList: false,
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  };

  const [consoleOperatorConfig, consoleOperatorConfigLoaded] =
    useK8sWatchResource<K8sResourceKind>(console);

  const [canPatchConsoleOperatorConfig] = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });

  return useMemo(
    () => ({ consoleOperatorConfig, consoleOperatorConfigLoaded, canPatchConsoleOperatorConfig }),
    [consoleOperatorConfig, consoleOperatorConfigLoaded, canPatchConsoleOperatorConfig],
  );
};

export const ConsolePluginStatus: FC<ConsolePluginStatusProps> = ({ status, errorMessage }) => {
  const { t } = useTranslation('console-app');

  const pluginStatusTitles = useMemo<Record<PluginInfoEntry['status'], string>>(
    () => ({
      failed: t('Failed'),
      loaded: t('Loaded'),
      pending: t('Pending'),
    }),
    [t],
  );

  return (
    <Status
      status={status}
      title={status === 'failed' ? errorMessage : pluginStatusTitles[status]}
    />
  );
};

export const ConsolePluginEnabledStatus: FC<ConsolePluginEnabledStatusProps> = ({
  pluginName,
  enabled,
  consoleOperatorConfig,
  canPatch,
}) => {
  const { t } = useTranslation('console-app');
  const launchModal = useOverlay();

  const labels = enabled ? t('Enabled') : t('Disabled');

  return (
    <>
      {canPatch && !developmentMode ? (
        <Button
          icon={<RhUiEditIcon />}
          iconPosition="end"
          data-test="edit-console-plugin"
          type="button"
          isInline
          onClick={() =>
            launchModal(LazyConsolePluginModalOverlay, {
              consoleOperatorConfig,
              pluginName,
              trusted: false,
            })
          }
          variant="link"
        >
          {labels}
        </Button>
      ) : (
        <>{labels}</>
      )}
    </>
  );
};

export const ConsolePluginCSPStatus: FC<ConsolePluginCSPStatusProps> = ({ hasViolations }) => {
  const { t } = useTranslation('console-app');

  return hasViolations ? (
    <>
      <YellowExclamationTriangleIcon
        className="co-icon-space-r"
        title={t(
          "This plugin might have violated the Console Content Security Policy. Refer to the browser's console logs for details.",
        )}
      />{' '}
      {t('Yes')}
    </>
  ) : (
    <>
      <GreenCheckCircleIcon className="co-icon-space-r" /> {t('No')}
    </>
  );
};

interface ConsolePluginStatusProps {
  status: PluginInfoEntry['status'];
  errorMessage?: string;
}

interface ConsolePluginEnabledStatusProps {
  pluginName: string;
  enabled: boolean;
  consoleOperatorConfig: K8sResourceKind;
  canPatch: boolean;
}

interface ConsolePluginCSPStatusProps {
  hasViolations: boolean;
}
