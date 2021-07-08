import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '@console/internal/components/factory';
import { HandlePromiseProps, history, withHandlePromise } from '@console/internal/components/utils';
import { k8sKill } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { VirtualMachineModel } from '../../../models';
import { getKubevirtAvailableModel } from '../../../models/kubevirtReferenceForModel';
import { VMKind } from '../../../types';

const CancelCustomizationModal = withHandlePromise<CancelCustomizationModalProps>(
  ({ inProgress, errorMessage, handlePromise, close, cancel, vm, backToVirt }) => {
    const { t } = useTranslation();

    // hack to close template source popup
    // programatically controlled popup is not responsive enough https://github.com/patternfly/patternfly-react/issues/4515
    const ref = React.useRef(null);
    React.useEffect(() => ref.current?.click(), []);

    const submit = (event) => {
      event.preventDefault();

      handlePromise(k8sKill(getKubevirtAvailableModel(VirtualMachineModel), vm), () => {
        backToVirt && history.push(`/k8s/ns/${vm.metadata.namespace}/virtualization`);
        close();
      });
    };

    return (
      <form onSubmit={submit} className="modal-content" ref={ref}>
        <ModalTitle>
          <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
          {t('kubevirt-plugin~Cancel customization?')}
        </ModalTitle>
        <ModalBody>
          {t(
            'kubevirt-plugin~This action will delete the boot source copy as well as all other temporary resources such as the virtual machine that is running the console.',
          )}
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          submitDisabled={inProgress}
          inProgress={inProgress}
          submitText={t('kubevirt-plugin~Cancel customization')}
          submitDanger
          cancel={cancel}
        />
      </form>
    );
  },
);

type CancelCustomizationModalProps = {
  vm: VMKind;
  backToVirt?: boolean;
} & ModalComponentProps &
  HandlePromiseProps;

const cancelCustomizationModal = createModalLauncher(CancelCustomizationModal);

export default cancelCustomizationModal;
