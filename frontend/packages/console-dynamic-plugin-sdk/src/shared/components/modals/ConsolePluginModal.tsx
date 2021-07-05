import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ConsolePluginRadioInputs,
  ConsolePluginWarning,
} from '@console/dynamic-plugin-sdk/src/shared/components/utils';
import { getPluginPatch, isPluginEnabled } from '@console/dynamic-plugin-sdk/src/shared/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import { k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';

export const ConsolePluginModal = withHandlePromise((props: ConsolePluginModalProps) => {
  const {
    cancel,
    close,
    consoleOperatorConfig,
    csvPluginsCount,
    errorMessage,
    handlePromise,
    inProgress,
    plugin,
    trusted,
  } = props;
  const previouslyEnabled = isPluginEnabled(consoleOperatorConfig, plugin);
  const { t } = useTranslation();
  const [enabled, setEnabled] = React.useState(previouslyEnabled);
  const submit = (event) => {
    event.preventDefault();
    const patch = getPluginPatch(consoleOperatorConfig, plugin, enabled);
    const promise = k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, [patch]);
    handlePromise(promise, close);
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>
        {csvPluginsCount > 1
          ? t('console-dynamic-plugin-sdk~Console plugin enablement - {{plugin}}', { plugin })
          : t('console-dynamic-plugin-sdk~Console plugin enablement')}
      </ModalTitle>
      <ModalBody>
        <p>
          {csvPluginsCount
            ? t(
                'console-dynamic-plugin-sdk~This operator includes a console plugin which provides a custom interface that can be included in the console. Updating the enablement of this console plugin will prompt for the console to be refreshed once it has been updated. Make sure you trust this console plugin before enabling.',
              )
            : t(
                'console-dynamic-plugin-sdk~This console plugin provides a custom interface that can be included in the console. Updating the enablement of this console plugin will prompt for the console to be refreshed once it has been updated. Make sure you trust this console plugin before enabling.',
              )}
        </p>
        <ConsolePluginRadioInputs autofocus name={plugin} enabled={enabled} onChange={setEnabled} />
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
      />
    </form>
  );
});

export const consolePluginModal = createModalLauncher(ConsolePluginModal);

export type ConsolePluginModalProps = {
  consoleOperatorConfig: K8sResourceKind;
  csvPluginsCount?: number;
  plugin: string;
  trusted: boolean;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
} & HandlePromiseProps;
