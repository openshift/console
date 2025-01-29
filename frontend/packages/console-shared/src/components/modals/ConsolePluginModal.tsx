import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import { k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';
import {
  ConsolePluginRadioInputs,
  ConsolePluginWarning,
} from '@console/shared/src/components/utils';
import { getPluginPatch, isPluginEnabled } from '@console/shared/src/utils';

export const ConsolePluginModal = withHandlePromise((props: ConsolePluginModalProps) => {
  const {
    cancel,
    close,
    consoleOperatorConfig,
    csvPluginsCount,
    errorMessage,
    handlePromise,
    inProgress,
    pluginName,
    trusted,
  } = props;
  const previouslyEnabled = isPluginEnabled(consoleOperatorConfig, pluginName);
  const { t } = useTranslation();
  const [enabled, setEnabled] = React.useState(previouslyEnabled);
  const submit = (event) => {
    event.preventDefault();
    const patch = getPluginPatch(consoleOperatorConfig, pluginName, enabled);
    const promise = k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, [patch]);
    handlePromise(promise, close);
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>
        {csvPluginsCount > 1
          ? t('console-shared~Console plugin enablement - {{plugin}}', { plugin: pluginName })
          : t('console-shared~Console plugin enablement')}
      </ModalTitle>
      <ModalBody>
        <p>
          {csvPluginsCount
            ? t(
                'console-shared~This operator includes a console plugin which provides a custom interface that can be included in the console. Updating the enablement of this console plugin will prompt for the console to be refreshed once it has been updated. Make sure you trust this console plugin before enabling.',
              )
            : t(
                'console-shared~This console plugin provides a custom interface that can be included in the console. Updating the enablement of this console plugin will prompt for the console to be refreshed once it has been updated. Make sure you trust this console plugin before enabling.',
              )}
        </p>
        <ConsolePluginRadioInputs
          autofocus
          name={pluginName}
          enabled={enabled}
          onChange={setEnabled}
        />
        <ConsolePluginWarning
          previouslyEnabled={previouslyEnabled}
          enabled={enabled}
          trusted={trusted}
        />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Save')}
        cancel={cancel}
        submitDisabled={(previouslyEnabled && enabled) || (!previouslyEnabled && !enabled)}
      />
    </form>
  );
});

export const consolePluginModal = createModalLauncher(ConsolePluginModal);

export type ConsolePluginModalProps = {
  consoleOperatorConfig: K8sResourceKind;
  csvPluginsCount?: number;
  pluginName: string;
  trusted: boolean;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
} & HandlePromiseProps;
