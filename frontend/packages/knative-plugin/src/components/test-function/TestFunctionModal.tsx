import type { FC } from 'react';
import { useState } from 'react';
import { Button, Form, ModalHeader, ModalBody, ModalFooter } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import type { ServiceKind } from '../../types';
import RequestPane from './RequestPane';
import ResponsePane from './ResponsePane';
import { ModalPanel } from './types';
import { clearResponseValues } from './utils';

import './TestFunctionModal.scss';

interface TestFunctionModalProps {
  service: ServiceKind;
}

type Props = FormikProps<FormikValues> & TestFunctionModalProps & ModalComponentProps;

const TestFunctionModal: FC<Props> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { handleSubmit, cancel, close, isSubmitting } = props;
  const [currentView, setCurrentView] = useState(ModalPanel.Request);

  return (
    <>
      <ModalHeader
        title={t('Test Serverless Function')}
        labelId="test-function-modal-title"
        data-test-id="modal-title"
      />
      <ModalBody className="kn-test-sf-modal" data-test="test-serverless-function">
        <Form
          id="test-function-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
            setCurrentView(ModalPanel.Response);
          }}
          className="pf-v6-u-mr-md"
        >
          <>
            {currentView === ModalPanel.Request ? (
              <RequestPane {...props} />
            ) : (
              <ResponsePane {...props} />
            )}
          </>
        </Form>
      </ModalBody>
      <ModalFooter>
        {currentView === ModalPanel.Request ? (
          <>
            <Button
              type="submit"
              variant="primary"
              data-test="test-action"
              isDisabled={isSubmitting}
              form="test-function-form"
            >
              {t('Test')}
            </Button>
            <Button
              type="button"
              variant="link"
              data-test="cancel-action"
              data-test-id="modal-cancel-action"
              onClick={cancel}
            >
              {t('Cancel')}
            </Button>
          </>
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
              {t('Back')}
            </Button>
            <Button
              type="button"
              variant="link"
              data-test="close-action"
              onClick={() => {
                clearResponseValues(props);
                close();
              }}
            >
              {t('Close')}
            </Button>
          </>
        )}
      </ModalFooter>
    </>
  );
};

export default TestFunctionModal;
