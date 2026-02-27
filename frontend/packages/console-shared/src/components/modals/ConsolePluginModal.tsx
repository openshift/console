import { useState } from 'react';
import { Button, Form, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import {
  ConsolePluginRadioInputs,
  ConsolePluginWarning,
} from '@console/shared/src/components/utils';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { getPluginPatch, isPluginEnabled } from '@console/shared/src/utils';
import { ModalFooterWithAlerts } from './ModalFooterWithAlerts';

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
    <>
      <ModalHeader
        title={
          csvPluginsCount > 1
            ? t('console-shared~Console plugin enablement - {{plugin}}', { plugin: pluginName })
            : t('console-shared~Console plugin enablement')
        }
        data-test-id="modal-title"
      />
      <ModalBody>
        <Form id="console-plugin-modal-form">
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
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          onClick={submit}
          form="console-plugin-modal-form"
          isLoading={inProgress}
          isDisabled={
            inProgress || (previouslyEnabled && enabled) || (!previouslyEnabled && !enabled)
          }
          data-test="confirm-action"
        >
          {t('public~Save')}
        </Button>
        <Button variant="link" onClick={cancel} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
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
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal variant={ModalVariant.small} isOpen onClose={handleClose}>
      <ConsolePluginModal
        close={handleClose}
        cancel={handleClose}
        consoleOperatorConfig={props.consoleOperatorConfig}
        csvPluginsCount={props.csvPluginsCount}
        pluginName={props.pluginName}
        trusted={props.trusted}
      />
    </Modal>
  ) : null;
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
