import * as React from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import ServerlessFxIcon from '@console/dev-console/src/components/import/ServerlessFxIcon';
import {
  getGroupVersionKindForModel,
  ResourceIcon,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ServiceModel } from '../../models';
import { ServiceKind } from '../../types';
import ModalBodyWrapper from './modal-components/ModalBodyWrapper';
import './TestFunctionModal.scss';

interface TestFunctionModalProps {
  service: ServiceKind;
}

type Props = FormikProps<FormikValues> & TestFunctionModalProps & ModalComponentProps;

const TestFunctionModal: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const { handleSubmit, cancel, close, isSubmitting, status, service, setFieldValue } = props;
  const { name, namespace } = service.data.metadata;
  const [svc, loaded] = useK8sGet<ServiceKind>(ServiceModel, name, namespace);

  React.useEffect(() => {
    if (loaded) {
      setFieldValue('endpoint.url', svc.status.url);
    }
  }, [loaded, svc, setFieldValue]);

  return (
    <Modal
      isOpen
      showClose={false}
      variant={ModalVariant.large}
      position="top"
      positionOffset="3%"
      className="kn-test-sf-modal__size"
      footer={
        <form onSubmit={handleSubmit}>
          <ModalSubmitFooter
            inProgress={isSubmitting}
            submitDisabled={isSubmitting}
            submitText={t('knative-plugin~Invoke')}
            cancelText={t('knative-plugin~Cancel')}
            className="kn-test-sf-modal__footer"
            cancel={cancel}
            errorMessage={status.error}
            buttonAlignment="left"
          />
        </form>
      }
    >
      <div className="modal-content">
        <ModalTitle close={close} className="kn-test-sf-modal__title">
          <span className="kn-test-sf-modal__title__icon">
            <ServerlessFxIcon />
          </span>
          {t(`knative-plugin~Test Serverless Function`)} &nbsp;
          <ResourceIcon
            groupVersionKind={getGroupVersionKindForModel(ServiceModel)}
            className="kn-test-sf-modal__title__badge"
          />
          {t(`knative-plugin~${name}`)}
        </ModalTitle>
        <ModalBody className="kn-test-sf-modal__body">
          <p className="kn-test-sf-modal__body__description">
            {t(
              'knative-plugin~Invokes the function by sending a test request to the currently running function instance',
            )}
          </p>
          <ModalBodyWrapper {...props} />
        </ModalBody>
      </div>
    </Modal>
  );
};

export default TestFunctionModal;
