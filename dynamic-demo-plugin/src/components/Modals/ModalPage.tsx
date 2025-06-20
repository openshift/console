import * as React from 'react';
import { Button, Flex, List, ListItem, Modal, ModalBody, ModalHeader, Spinner} from '@patternfly/react-core';
import {
  DocumentTitle,
  K8sResourceCommon,
  useK8sWatchResource,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import './modal.scss';
import { useTranslation } from 'react-i18next';

export const scResource = {
  kind: 'StorageClass',
  namespaced: false,
  isList: true,
};

export const TestModal: React.FC<{ closeModal: () => void }> = (props) => {
  const [res] = useK8sWatchResource<K8sResourceCommon[]>(scResource);
  const { t } = useTranslation("plugin__console-demo-plugin");
  return (
    <Modal
      isOpen
      onClose={props?.closeModal}
    >
      <ModalHeader title={t('Storage Classes')} />
      <ModalBody>
        {t('StorageClasses present in this cluster:')}
        <List>
          {!!res &&
            res.map((item) => <ListItem key={item.metadata.uid}>{item.metadata.name}</ListItem>)}
        </List>
      </ModalBody>
    </Modal>
  );
};

const testComponentWithIDStyle: React.CSSProperties = {
  backgroundColor: 'gray',
  padding: '1rem 4rem',
  position: 'absolute',
  right: '5rem',
  textAlign: 'center',
  zIndex: 9999,
};

const TEST_ID_1 = 'TEST_ID_1';
const TestComponentWithID1 = ({ closeModal }) => (
  <div style={{ ...testComponentWithIDStyle, top: '5rem' }}>
    <p>Test Modal with ID "{TEST_ID_1}"</p>
    <Button onClick={closeModal}>Close</Button>
  </div>
);

const TEST_ID_2 = 'TEST_ID_2';
const TestComponentWithID2 = ({ closeModal, ...rest }) => (
  <div style={{ ...testComponentWithIDStyle, bottom: '5rem' }}>
    <p>
      Test Modal with ID "{TEST_ID_2}" and testProp "{rest.testProp}"
    </p>
    <Button onClick={closeModal}>Close</Button>
  </div>
);

const LoadingComponent: React.FC = () => {
  const { t } = useTranslation("plugin__console-demo-plugin");

  return (
    <Flex
      className="demo-modal__loader"
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentCenter' }}
      grow={{ default: 'grow' }}
    >
      <Spinner size="xl" aria-label={t('Component is resolving')} />
    </Flex>
  );
};

export const TestModalPage: React.FC<{ closeComponent: any }> = () => {
  const launchModal = useModal();
  const { t } = useTranslation("plugin__console-demo-plugin");

  const TestComponent = ({ closeModal, ...rest }) => (
    <TestModal closeModal={closeModal} {...rest} />
  );

  const Component = React.lazy(() =>
    Promise.all([import('./ModalPage')]).then(([m]) => ({
      default: m.TestModal,
    })),
  );

  const AsyncTestComponent = ({ closeModal, ...rest }) => {
    return (
      <React.Suspense fallback={LoadingComponent}>
        <Component closeModal={closeModal} {...rest} />
      </React.Suspense>
    );
  };

  const onClick = React.useCallback(() => launchModal(TestComponent, {}), [launchModal]);
  const onAsyncClick = React.useCallback(() => launchModal(AsyncTestComponent, {}), [launchModal]);

  const onClickWithID1 = React.useCallback(
    () => launchModal(TestComponentWithID1, {}, TEST_ID_1),
    [launchModal],
  );

  const onClickWithID2 = React.useCallback(
    () => launchModal(TestComponentWithID2, { testProp: 'abc' }, TEST_ID_2),
    [launchModal],
  );

  return (
    <Flex
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentCenter' }}
      grow={{ default: 'grow' }}
      direction={{ default: 'column' }}
      className="demo-modal__page"
    >
      <DocumentTitle>{t('Modal Launchers')}</DocumentTitle>
      <Button onClick={onClick}>{t('Launch Modal')}</Button>
      <Button onClick={onAsyncClick}>
        {t('Launch Modal Asynchronously')}
      </Button>
      <Button onClick={onClickWithID1}>
        {t('plugin__console-demo-plugin~Launch Modal with ID 1')}
      </Button>
      <Button onClick={onClickWithID2}>
        {t('plugin__console-demo-plugin~Launch Modal with ID 2')}
      </Button>
    </Flex>
  );
};
