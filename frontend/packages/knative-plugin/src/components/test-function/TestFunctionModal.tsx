import * as React from 'react';
import { Button, Modal, ModalVariant, Title, TitleSizes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { ModalComponentProps } from '@console/internal/components/factory/modal';
import { ServiceKind } from '../../types';
import RequestPane from './RequestPane';
import ResponsePane from './ResponsePane';
import { ModalPanel } from './types';
import { clearResponseValues } from './utils';

import './TestFunctionModal.scss';

interface TestFunctionModalProps {
  service: ServiceKind;
}

type Props = FormikProps<FormikValues> & TestFunctionModalProps & ModalComponentProps;

const TestFunctionModal: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const { handleSubmit, cancel, close, isSubmitting } = props;
  const [currentView, setCurrentView] = React.useState(ModalPanel.Request);
  const header = (
    <>
      <Title id="modal-custom-header-label" headingLevel="h1" size={TitleSizes['2xl']}>
        {t(`knative-plugin~Test Serverless Function`)}
      </Title>
    </>
  );

  const footer = (
    <>
      {currentView === ModalPanel.Request ? (
        <form
          onSubmit={() => {
            handleSubmit();
            setCurrentView(ModalPanel.Response);
          }}
        >
          <Button type="submit" variant="primary" data-test="test-action" isDisabled={isSubmitting}>
            {t('knative-plugin~Test')}
          </Button>
          &nbsp; &nbsp;
          <Button type="button" variant="secondary" data-test="cancel-action" onClick={cancel}>
            {t('knative-plugin~Cancel')}
          </Button>
        </form>
      ) : (
        <>
          <Button
            type="button"
            variant="primary"
            data-test="back-action"
            onClick={() => {
              clearResponseValues(props);
              setCurrentView(ModalPanel.Request);
            }}
          >
            {t('knative-plugin~Back')}
          </Button>
          &nbsp;
          <Button
            type="button"
            variant="secondary"
            data-test="close-action"
            onClick={() => {
              clearResponseValues(props);
              close();
            }}
          >
            {t('knative-plugin~Close')}
          </Button>
        </>
      )}
    </>
  );

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen
      header={header}
      className="kn-test-sf-modal"
      onClose={close}
      position="top"
      footer={footer}
      data-test="test-serverless-function"
    >
      <div className="kn-test-sf-modal__body">
        {currentView === ModalPanel.Request ? (
          <RequestPane {...props} />
        ) : (
          <ResponsePane {...props} />
        )}
      </div>
    </Modal>
  );
};

export default TestFunctionModal;
