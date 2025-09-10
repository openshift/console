import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { k8sPatch, K8sKind } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { OperatorHubKind } from '../operator-hub';

const DisableDefaultSourceModal: React.FC<DisableSourceModalProps> = ({
  kind,
  operatorHub,
  sourceName,
  close,
  cancel,
}) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation();
  const submit = React.useCallback(
    (event: React.FormEvent<EventTarget>): void => {
      event.preventDefault();
      const currentSources = _.get(operatorHub, 'spec.sources', []);
      const patch = [
        {
          op: 'add',
          path: '/spec/sources',
          value: [
            ..._.filter(currentSources, (source) => source.name !== sourceName),
            {
              name: sourceName,
              disabled: true,
            },
          ],
        },
      ];
      handlePromise(k8sPatch(kind, operatorHub, patch))
        .then(() => {
          close?.();
        })
        .catch(() => {});
    },
    [close, handlePromise, kind, operatorHub, sourceName],
  );

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {t('olm~Disable CatalogSource?')}
      </ModalTitle>
      <ModalBody>
        {t(
          'olm~By disabling a default source, the operators it provides will no longer appear in OperatorHub and any operator that has been installed from this source will no longer receive updates until the source is re-enabled. Disabling the source will also remove the corresponding OperatorSource and CatalogSource resources from the cluster.',
        )}
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('public~Disable')}
        cancel={cancel}
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitDanger
      />
    </form>
  );
};

type DisableSourceModalProps = {
  kind: K8sKind;
  operatorHub: OperatorHubKind;
  sourceName: string;
} & ModalComponentProps;

export const disableDefaultSourceModal = createModalLauncher(DisableDefaultSourceModal);
