import * as React from 'react';
import {
  Button,
  Flex,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
} from '@patternfly/react-core';
import {
  DocumentTitle,
  K8sResourceCommon,
  ModalComponent,
  OverlayComponent,
  useK8sWatchResource,
  useModal,
  useOverlay,
} from '@openshift-console/dynamic-plugin-sdk';
import './modal.scss';
import { useTranslation } from 'react-i18next';

export const scResource = {
  kind: 'StorageClass',
  namespaced: false,
  isList: true,
};

export const TestModal: ModalComponent = (props) => {
  const [res] = useK8sWatchResource<K8sResourceCommon[]>(scResource);
  const { t } = useTranslation('plugin__console-demo-plugin');
  return (
    <Modal isOpen onClose={props?.closeModal}>
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

const LoadingComponent: React.FC = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');

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

type TestOverlayComponentProps = {
  heading?: string;
};

const TestOverlayComponent: OverlayComponent<TestOverlayComponentProps> = ({
  closeOverlay,
  heading = 'Default heading',
}) => {
  const [right] = React.useState(`${800 * Math.random()}px`);
  const [top] = React.useState(`${800 * Math.random()}px`);

  return (
    <div
      style={{
        backgroundColor: 'gray',
        padding: '1rem 4rem',
        position: 'absolute',
        right,
        textAlign: 'center',
        top,
        zIndex: 999,
      }}
    >
      <h2>{heading}</h2>
      <Button onClick={closeOverlay}>Close</Button>
    </div>
  );
};

const OverlayModal = ({ body, closeOverlay, title }) => (
  <Modal isOpen onClose={closeOverlay}>
    <ModalHeader title={title} />
    <ModalBody>{body}</ModalBody>
  </Modal>
);

export const TestModalPage: React.FC<{ closeComponent: any }> = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');

  const launchModal = useModal();
  const launchOverlay = useOverlay();

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

  const onClick = React.useCallback(() => {
    launchModal(TestComponent, {});
  }, [launchModal]);

  const onAsyncClick = React.useCallback(() => {
    launchModal(AsyncTestComponent, {});
  }, [launchModal]);

  const onClickOverlayBasic = React.useCallback(() => {
    launchOverlay(TestOverlayComponent, {});
  }, [launchOverlay]);

  const onClickOverlayWithProps = React.useCallback(() => {
    launchOverlay(TestOverlayComponent, { heading: t('Test overlay with props') });
  }, [launchOverlay]);

  const onClickOverlayModal = React.useCallback(() => {
    launchOverlay(OverlayModal, {
      body: t('Test modal launched with useOverlay'),
      title: t('Overlay modal'),
    });
  }, [launchOverlay]);

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
      <Button onClick={onAsyncClick}>{t('Launch Modal Asynchronously')}</Button>
      <Button onClick={onClickOverlayBasic}>
        {t('plugin__console-demo-plugin~Launch overlay')}
      </Button>
      <Button onClick={onClickOverlayWithProps}>
        {t('plugin__console-demo-plugin~Launch overlay with props')}
      </Button>
      <Button onClick={onClickOverlayModal}>
        {t('plugin__console-demo-plugin~Launch overlay modal')}
      </Button>
    </Flex>
  );
};
