import * as React from 'react';
import { Alert } from '@patternfly/react-core/dist/esm/components/Alert';
import { Label } from '@patternfly/react-core/dist/esm/components/Label';
import { FormikProps, FormikValues } from 'formik/dist/types';
import { useTranslation } from 'react-i18next';
import { ExpandCollapse, Loading } from '@console/internal/components/utils';
import { CodeEditorField } from '@console/shared/src/components';

import './TestFunctionModal.scss';

type Response = {
  status: string;
  statusCode: number;
  header: Record<string, string[]>;
  body: string;
};

type ResponsePaneFormikValues = {
  response?: Response | undefined;
};

const ResponsePane: React.FC<FormikProps<FormikValues & ResponsePaneFormikValues>> = ({
  values,
}) => {
  const { t } = useTranslation();
  const { statusCode, header } = values.response;

  return (
    <>
      <div className="kn-test-sf-modal-response__notification">
        {statusCode === null ? (
          <Alert
            variant="info"
            title={t('knative-plugin~Waiting for response')}
            data-test="alert-wait"
          />
        ) : statusCode === 200 ? (
          <Alert
            variant="success"
            title={t('knative-plugin~The Test was Successful')}
            data-test="alert-success"
          >
            <div>
              {' '}
              <strong>{t('knative-plugin~Response Status Code: ')}</strong>
              <Label color="green">
                <strong>{statusCode}</strong>
              </Label>
            </div>
          </Alert>
        ) : (
          <Alert
            variant="danger"
            title={t('knative-plugin~An error occurred')}
            data-test="alert-danger"
          >
            <div>
              {' '}
              <strong>{t('knative-plugin~Response Status Code: ')}</strong>
              <Label color="red">
                <strong>{statusCode}</strong>
              </Label>
            </div>
          </Alert>
        )}
      </div>

      {Object.keys(header).length > 0 && (
        <div className="kn-test-sf-modal-response__headers">
          <ExpandCollapse
            textCollapsed={t('knative-plugin~Show Response Headers')}
            textExpanded={t('knative-plugin~Hide Response Headers')}
          >
            <div className="header-section">
              {Object.entries(header).map(([headerName, headerValues]) =>
                headerValues.map((value) => (
                  <div className="header-row" key={`${headerName}-${value}`}>
                    <span className="header-name">{headerName}:</span>
                    <span className="header-value">{value}</span>
                  </div>
                )),
              )}
            </div>
          </ExpandCollapse>
        </div>
      )}

      <div className="kn-test-sf-modal__editor">
        {statusCode !== null ? (
          <CodeEditorField
            name="response.body"
            minHeight="34vh"
            showSamples={false}
            showShortcuts={false}
            showMiniMap={false}
            language="json"
          />
        ) : (
          <Loading className="kn-test-sf-modal-response__loading" />
        )}
      </div>
    </>
  );
};

export default ResponsePane;
