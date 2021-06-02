import * as React from 'react';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { InputField, getFieldId } from '@console/shared';
import { EventSources } from '../import-types';

interface SinkBindingSectionProps {
  title: string;
  fullWidth?: boolean;
}

const SinkBindingSection: React.FC<SinkBindingSectionProps> = ({ title, fullWidth }) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const initVal =
    values?.formData?.data?.[EventSources.SinkBinding]?.subject?.selector?.matchLabels || {};
  const initialValueResources = !_.isEmpty(initVal)
    ? _.map(initVal, (key, val) => [val, key])
    : [['', '']];
  const [nameValue, setNameValue] = React.useState(initialValueResources);
  const handleNameValuePairs = React.useCallback(
    ({ nameValuePairs }) => {
      let updatedNameValuePairs = {};
      _.forEach(nameValuePairs, ([name, value]) => {
        if (value.length) {
          updatedNameValuePairs = { ...updatedNameValuePairs, [name]: value };
          return updatedNameValuePairs;
        }
        return updatedNameValuePairs;
      });
      setNameValue(nameValuePairs);
      setFieldValue(
        `formData.data.${EventSources.SinkBinding}.subject.selector.matchLabels`,
        updatedNameValuePairs,
      );
    },
    [setFieldValue],
  );
  const fieldId = getFieldId(values.type, 'subject-matchLabels');
  return (
    <FormSection title={title} extraMargin fullWidth={fullWidth}>
      <h3 className="co-section-heading-tertiary">{t('knative-plugin~Subject')}</h3>
      <InputField
        data-test-id="sinkbinding-apiversion-field"
        type={TextInputTypes.text}
        name={`formData.data.${EventSources.SinkBinding}.subject.apiVersion`}
        label={t('knative-plugin~apiVersion')}
        required
      />
      <InputField
        data-test-id="sinkbinding-kind-field"
        type={TextInputTypes.text}
        name={`formData.data.${EventSources.SinkBinding}.subject.kind`}
        label={t('knative-plugin~Kind')}
        required
      />
      <FormGroup fieldId={fieldId} label={t('knative-plugin~Match labels')}>
        <AsyncComponent
          loader={() =>
            import('@console/internal/components/utils/name-value-editor').then(
              (c) => c.NameValueEditor,
            )
          }
          nameValuePairs={nameValue}
          valueString={t('knative-plugin~Value')}
          nameString={t('knative-plugin~Name')}
          addLabel={t('knative-plugin~Add values')}
          readOnly={false}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
        />
      </FormGroup>
    </FormSection>
  );
};

export default SinkBindingSection;
