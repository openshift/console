import * as React from 'react';
import { Button, SelectVariant, TextInputTypes, ExpandableSection } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { FormikProps, FormikValues } from 'formik/dist/types';
import { useTranslation } from 'react-i18next';
import { AsyncComponent } from '@console/internal/components/utils/async';
import {
  DropdownField,
  InputField,
  SelectInputField,
  SelectInputOption,
  CodeEditorField,
} from '@console/shared/src/components';
import { FormLayout } from '@console/shared/src/components/cluster-configuration';
import { InvokeFormat } from './types';
import { getcurrentLanguage } from './utils';

import './TestFunctionModal.scss';

const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() =>
      import('@console/internal/components/utils/name-value-editor').then((c) => c.NameValueEditor)
    }
    {...props}
  />
);

const RequestPane: React.FC<FormikProps<FormikValues>> = ({ setFieldValue, values }) => {
  const { t } = useTranslation();
  const [showCustomHeaders, setShowCustomHeaders] = React.useState(false);
  const {
    request: { customHeaders, format: invokeFormat, contentType, isAdvancedSettingsExpanded },
  } = values;
  const [isExpanded, setIsExpanded] = React.useState<boolean>(isAdvancedSettingsExpanded);

  const onToggle = (expanded: boolean) => {
    setIsExpanded(expanded);
    setFieldValue('request.isAdvancedSettingsExpanded', expanded);
  };

  const formatItems = {
    [InvokeFormat.CloudEvent]: t('knative-plugin~CloudEvent'),
    [InvokeFormat.HTTP]: t('knative-plugin~HTTP'),
  };

  const contentTypeItems: SelectInputOption[] = [
    { value: 'application/json', label: t('knative-plugin~application/json'), disabled: false },
    { value: 'application/yaml', label: t('knative-plugin~application/yaml'), disabled: false },
  ];
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
    <>
      <FormLayout>
        <DropdownField
          label={t('knative-plugin~Format')}
          name="request.format"
          items={formatItems}
          dataTest="invoke-format-dropdown"
          title={t(`knative-plugin~${invokeFormat}`)}
          fullWidth
          required
        />
        <SelectInputField
          name="request.contentType"
          label={t('knative-plugin~Content-Type')}
          options={contentTypeItems}
          variant={SelectVariant.typeahead}
          isInputValuePersisted
          toggleOnSelection
          hideClearButton
          required
        />
      </FormLayout>
      <div className="kn-test-sf-modal-request__advanced-settings">
        <ExpandableSection
          toggleText={t('knative-plugin~Advanced Settings')}
          onToggle={onToggle}
          isExpanded={isExpanded}
          data-test="advanced-settings"
        >
          <FormLayout>
            <InputField
              type={TextInputTypes.text}
              name={`request.type`}
              label={t('knative-plugin~Type')}
              data-test="request-type"
              placeholder="boson.fn"
            />
            <InputField
              type={TextInputTypes.text}
              name={`request.source`}
              label={t('knative-plugin~Source')}
              data-test="request-source"
              placeholder="/boson/fn"
            />
          </FormLayout>

          <div className="kn-test-sf-modal-request__custom-headers">
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
                data-test="add-optional-header"
                onClick={() => setShowCustomHeaders(true)}
                type="button"
                variant="link"
              >
                <PlusCircleIcon data-test-id="pairs-list__add-icon" className="co-icon-space-r" />
                {t('knative-plugin~Add optional headers')}
              </Button>
            )}
          </div>
        </ExpandableSection>
      </div>
      <div className="kn-test-sf-modal__editor">
        <CodeEditorField
          name="request.body.data"
          minHeight="34vh"
          showSamples={false}
          showShortcuts={false}
          showMiniMap={false}
          language={getcurrentLanguage(contentType)}
        />
      </div>
    </>
  );
};

export default RequestPane;
