import type { FC } from 'react';
import { useCallback } from 'react';
import { Modal } from '@patternfly/react-core';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { ModalComponentProps } from '@console/internal/components/factory';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import type { ServiceKind } from '../../types';
import TestFunction from './TestFunction';

type TestFunctionControllerProps = {
  obj: ServiceKind;
};

const TestFunctionController: FC<TestFunctionControllerProps> = (props) => {
  const { obj } = props;

  const [service, loaded, loadError] = useK8sWatchResource<ServiceKind>({
    kind: referenceForModel(ServiceModel),
    isList: false,
    namespace: obj.metadata.namespace,
    name: obj.metadata.name,
  });

  if (!loaded) {
    return null;
  }

  if (loadError || !service) {
    return null;
  }

  return <TestFunction {...props} service={service} />;
};

type Props = TestFunctionControllerProps & ModalComponentProps;

const TestFunctionModalProvider: OverlayComponent<Props> = (props) => {
  return (
    <Modal isOpen onClose={props.closeOverlay} variant="small">
      <TestFunctionController cancel={props.closeOverlay} close={props.closeOverlay} {...props} />
    </Modal>
  );
};

export const useTestFunctionModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return useCallback(() => launcher<Props>(TestFunctionModalProvider, props), [launcher, props]);
};
