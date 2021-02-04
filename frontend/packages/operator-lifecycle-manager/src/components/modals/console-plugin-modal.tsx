import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';
import { SubscriptionKind } from '../../types';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';
import { getPluginPatch, isCatalogSourceTrusted, isPluginEnabled } from '../../utils';
import { ConsolePluginWarning } from '../../utils/console-plugin-warning';
import { ConsolePluginRadioInputs } from '../../utils/console-plugin-radio-inputs';

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
    subscription,
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
        {csvPluginsCount === 1 && <>{t('olm~Console UI extension')}</>}
        {csvPluginsCount > 1 && <>{t('olm~Console UI extension - {{plugin}}', { plugin })}</>}
      </ModalTitle>
      <ModalBody>
        <p>
          {t(
            'olm~This operator provides a custom interface you can include in your console.  Make sure you trust this operator before enabling its interface.',
          )}
        </p>
        <ConsolePluginRadioInputs autofocus name={plugin} enabled={enabled} onChange={setEnabled} />
        <ConsolePluginWarning
          previouslyEnabled={previouslyEnabled}
          enabled={enabled}
          trusted={isCatalogSourceTrusted(subscription?.spec?.source)}
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
  csvPluginsCount: number;
  plugin: string;
  subscription: SubscriptionKind;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
} & HandlePromiseProps;
