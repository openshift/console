import * as React from 'react';
import { Button, TextInputTypes } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { FormikProps, FormikValues } from 'formik/dist/types';
import { useTranslation } from 'react-i18next';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { DropdownField, InputField } from '@console/shared/src/components';
import { FormLayout } from '@console/shared/src/components/cluster-configuration';
import { InvokeFormat } from '../types';
import '../TestFunctionModal.scss';

const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() =>
      import('@console/internal/components/utils/name-value-editor').then((c) => c.NameValueEditor)
    }
    {...props}
  />
);

const RequestOptions: React.FC<FormikProps<FormikValues>> = ({ setFieldValue, values }) => {
  const { t } = useTranslation();
  const [showCustomHeaders, setShowCustomHeaders] = React.useState(false);
  const {
    request: { customHeaders, format: invokeFormat },
  } = values;

  const formatItems = {
    [InvokeFormat.CloudEvent]: t('knative-plugin~CloudEvent'),
    [InvokeFormat.HTTP]: t('knative-plugin~HTTP'),
  };

  const handleNameValuePairs = ({ nameValuePairs: updatedNameValuePairs }) => {
    /* Removing the extra element from arrays that are auto-generated */
    updatedNameValuePairs.forEach((arr) => arr.length >= 3 && arr.splice(2, 1));

    setFieldValue(`request.customHeaders`, updatedNameValuePairs);
  };

  const checkCustomHeadersIsEmpty = () => {
    let filteredArray = [];
    if (invokeFormat === InvokeFormat.HTTP) {
      filteredArray = customHeaders.filter((arr) => !arr.every((element) => element === ''));
    } else if (invokeFormat === InvokeFormat.CloudEvent) {
      filteredArray = customHeaders.filter((arr) => !arr.every((element) => element === ''));
    }
    return filteredArray.length === 0;
  };

  return (
    <div className="kn-test-sf-modal-request-pane--options__size">
      <FormLayout isHorizontal>
        <DropdownField
          label={t('knative-plugin~Format')}
          name="request.format"
          items={formatItems}
          title={t(`knative-plugin~${invokeFormat}`)}
          fullWidth
          required
        />
        <InputField
          type={TextInputTypes.text}
          name={`request.contentType`}
          label={t('knative-plugin~Content-Type')}
          placeholder="application/json"
          required
        />
        <InputField
          type={TextInputTypes.text}
          name={`request.type`}
          label={t('knative-plugin~Type')}
          placeholder="boson.fn"
        />
        <InputField
          type={TextInputTypes.text}
          name={`request.source`}
          label={t('knative-plugin~Source')}
          placeholder="/boson/fn"
        />
      </FormLayout>

      <div className="kn-test-sf-modal-request-pane--options__custom-headers">
        {showCustomHeaders || !checkCustomHeadersIsEmpty() ? (
          <NameValueEditorComponent
            nameValuePairs={customHeaders}
            nameString={t('knative-plugin~Name')}
            valueString={t('knative-plugin~Value')}
            addString={t('knative-plugin~Add headers')}
            readOnly={false}
            allowSorting={false}
            updateParentData={handleNameValuePairs}
          />
        ) : (
          <Button
            className="pf-m-link--align-left"
            data-test="add-button"
            onClick={() => setShowCustomHeaders(true)}
            type="button"
            variant="link"
          >
            <PlusCircleIcon data-test-id="pairs-list__add-icon" className="co-icon-space-r" />
            {t('knative-plugin~Add optional headers')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RequestOptions;
