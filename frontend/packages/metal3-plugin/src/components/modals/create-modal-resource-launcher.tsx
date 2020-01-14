import * as React from 'react';
import * as _ from 'lodash';
import { Provider } from 'react-redux';
import * as Modal from 'react-modal';
import { Router } from 'react-router-dom';
import * as classNames from 'classnames';
import store from '@console/internal/redux';
import {
  Firehose,
  history,
  FirehoseResource,
  FirehoseResult,
} from '@console/internal/components/utils';
import { createModal, GetModalContainer } from '@console/internal/components/factory';

const ModalComponentWrapper: React.FC<ModalComponentWrapperProps> = ({
  Component,
  onClose,
  onCancel,
  resourcesToProps,
  resources = {},
  modalProps = {},
}) => {
  const resourceProps = resourcesToProps ? resourcesToProps(resources) || {} : resources;

  return (
    <Modal
      isOpen
      contentLabel="Modal"
      onRequestClose={onClose}
      className={classNames('modal-dialog', modalProps.modalClassName)}
      overlayClassName="co-overlay"
      shouldCloseOnOverlayClick={!modalProps.blocking}
    >
      <Component
        {...(_.omit(modalProps, 'blocking', 'modalClassName') as any)}
        {...resourceProps}
        cancel={onCancel}
        close={onClose}
      />
    </Modal>
  );
};

export const createModalResourceLauncher: CreateModalResourceLauncher = (
  Component,
  resources,
  resourcesToProps,
) => (props) => {
  const getModalContainer: GetModalContainer = (onClose) => {
    const handleClose = (e: React.SyntheticEvent) => {
      onClose && onClose(e);
      props.close && props.close();
    };
    const handleCancel = (e: React.SyntheticEvent) => {
      props.cancel && props.cancel();
      handleClose(e);
    };

    return (
      <Provider store={store}>
        <Router {...{ history, basename: window.SERVER_FLAGS.basePath }}>
          <Firehose resources={resources}>
            <ModalComponentWrapper
              Component={Component}
              onClose={handleClose}
              onCancel={handleCancel}
              modalProps={props}
              resourcesToProps={resourcesToProps}
            />
          </Firehose>
        </Router>
      </Provider>
    );
  };
  return createModal(getModalContainer);
};

type ResourcesToProps = (res: { [key: string]: FirehoseResult }) => { [key: string]: any };

type CreateModalResourceLauncher = (
  Component: React.ComponentType<any>,
  resources: FirehoseResource[],
  resourcesToProps?: ResourcesToProps,
) => (props: any) => { result: Promise<any> };

type ModalComponentWrapperProps = {
  loadError?: any;
  loaded?: boolean;
  Component: React.ComponentType<any>;
  onCancel: (e?: React.SyntheticEvent) => void;
  onClose: (e?: React.SyntheticEvent) => void;
  resourcesToProps?: ResourcesToProps;
  modalProps?: { [key: string]: any };
  resources?: { [key: string]: FirehoseResult };
};
