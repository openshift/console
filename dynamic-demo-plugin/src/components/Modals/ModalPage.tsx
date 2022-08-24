import * as React from 'react';
import { Button, Flex, List, ListItem, Modal, Spinner } from '@patternfly/react-core';
import {
  K8sResourceCommon,
  useK8sWatchResource,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import './modal.scss';

export const scResource = {
  kind: 'StorageClass',
  namespaced: false,
  isList: true,
};

export const TestModal: React.FC<{ closeModal: () => void }> = (props) => {
  const [res] = useK8sWatchResource<K8sResourceCommon[]>(scResource);
  return (
    <Modal isOpen onClose={props?.closeModal} title="Storage Classes">
      StorageClasses present in this cluster:
      <List>
        {!!res &&
          res.map((item) => <ListItem key={item.metadata.uid}>{item.metadata.name}</ListItem>)}
      </List>
    </Modal>
  );
};

const LoadingComponent: React.FC = () => (
  <Flex
    className="demo-modal__loader"
    alignItems={{ default: 'alignItemsCenter' }}
    justifyContent={{ default: 'justifyContentCenter' }}
    grow={{ default: 'grow' }}
  >
    <Spinner isSVG size="xl" aria-label="Component is resolving" />
  </Flex>
);

export const TestModalPage: React.FC<{ closeComponent: any }> = () => {
  const launchModal = useModal();

  const TestComponent =
    ({ closeModal, ...rest }) =>
      <TestModal closeModal={closeModal} {...rest} />;

  const Component = React.lazy(() =>
    Promise.all([import('./ModalPage')]).then(([m]) => ({
      default: m.TestModal,
    })),
  );

  const AsyncTestComponent =
    ({ closeModal, ...rest }) => {
      return (
        <React.Suspense fallback={LoadingComponent}>
          <Component closeModal={closeModal} {...rest} />
        </React.Suspense>
      );
    };

  const onClick = React.useCallback(() => launchModal(TestComponent, {}), [launchModal]);
  const onAsyncClick = React.useCallback(() => launchModal(AsyncTestComponent, {}), [launchModal]);

  return (
    <Flex
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentCenter' }}
      grow={{ default: 'grow' }}
      direction={{ default: 'column' }}
      className="demo-modal__page"
    >
      <Button onClick={onClick}>Launch Modal</Button>
      <Button onClick={onAsyncClick}>Launch Modal Asynchronously</Button>
    </Flex>
  );
};
