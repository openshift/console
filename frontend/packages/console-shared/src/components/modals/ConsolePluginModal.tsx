import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalWrapper,
} from '@console/internal/components/factory/modal';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import {
  ConsolePluginRadioInputs,
  ConsolePluginWarning,
} from '@console/shared/src/components/utils';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { getPluginPatch, isPluginEnabled } from '@console/shared/src/utils';

export const ConsolePluginModal = (props: ConsolePluginModalProps) => {
  const { cancel, close, consoleOperatorConfig, csvPluginsCount, pluginName, trusted } = props;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const previouslyEnabled = isPluginEnabled(consoleOperatorConfig, pluginName);
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(previouslyEnabled);
  const submit = (event): void => {
    event.preventDefault();
    const patch = getPluginPatch(consoleOperatorConfig, pluginName, enabled);
    const promise = k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, [patch]);
    handlePromise(promise)
      .then(() => close())
      .catch(() => {});
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
};

type ConsolePluginModalProviderProps = {
  consoleOperatorConfig: K8sResourceKind;
  csvPluginsCount?: number;
  pluginName: string;
  trusted: boolean;
};

export const ConsolePluginModalOverlay: OverlayComponent<ConsolePluginModalProviderProps> = (
  props,
) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <ConsolePluginModal
        close={props.closeOverlay}
        cancel={props.closeOverlay}
        consoleOperatorConfig={props.consoleOperatorConfig}
        csvPluginsCount={props.csvPluginsCount}
        pluginName={props.pluginName}
        trusted={props.trusted}
      />
    </ModalWrapper>
  );
};

export default ConsolePluginModalOverlay;

export type ConsolePluginModalProps = {
  consoleOperatorConfig: K8sResourceKind;
  csvPluginsCount?: number;
  pluginName: string;
  trusted: boolean;
  cancel?: () => void;
  close?: () => void;
};
