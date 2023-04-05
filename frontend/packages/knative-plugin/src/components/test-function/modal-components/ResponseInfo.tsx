import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik/dist/types';
import { useTranslation } from 'react-i18next';
import { AsyncComponent } from '@console/internal/components/utils/async';

const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() =>
      import('@console/internal/components/utils/name-value-editor').then((c) => c.NameValueEditor)
    }
    {...props}
  />
);

const ResponseInfo: React.FC<FormikProps<FormikValues>> = ({ values }) => {
  const { t } = useTranslation();

  return (
    <div className="kn-test-sf-modal-response-pane--info__size">
      <div className="pf-c-form__group kn-test-sf-modal-response-pane--info__status">
        <div className="pf-c-form__group-label kn-test-sf-modal-response-pane--info__status__label">
          <label className="pf-c-form__label">
            <span className="pf-c-form__label-text">{t('knative-plugin~Status')}</span>&nbsp;
          </label>
        </div>
        <div className="pf-c-form__group-control">
          <Label color="green" className="kn-test-sf-modal-response-pane--info__status__code">
            200 OK
          </Label>
        </div>
      </div>
      <br />
      <NameValueEditorComponent
        nameValuePairs={Object.entries(values.response.headers)}
        nameString={t('knative-plugin~Response Header')}
        readOnly
        allowSorting={false}
      />
    </div>
  );
};

export default ResponseInfo;
