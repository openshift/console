import type { FC } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { DropdownField, InputField, getFieldId } from '@console/shared';
import TertiaryHeading from '@console/shared/src/components/heading/TertiaryHeading';
import { EventSources } from '../import-types';

interface SinkBindingSectionProps {
  title: string;
  fullWidth?: boolean;
}

const SinkBindingSection: FC<SinkBindingSectionProps> = ({ title, fullWidth }) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const initVal =
    values?.formData?.data?.[EventSources.SinkBinding]?.subject?.selector?.matchLabels || {};
  const initialValueResources = !_.isEmpty(initVal)
    ? _.map(initVal, (key, val) => [val, key])
    : [['', '']];
  const [nameValue, setNameValue] = useState(initialValueResources);
  const handleNameValuePairs = useCallback(
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

  const matchType = values.sinkBindingMatchType;
  useEffect(() => {
    if (matchType === 'name') {
      setFieldValue(`formData.data.${EventSources.SinkBinding}.subject.selector`, undefined);
    } else {
      setFieldValue(`formData.data.${EventSources.SinkBinding}.subject.name`, undefined);
      setFieldValue(
        `formData.data.${EventSources.SinkBinding}.subject.selector.matchLabels`,
        nameValue.reduce((acc, [name, val]) => (val.length ? { ...acc, [name]: val } : acc), {}),
      );
    }
  }, [matchType, setFieldValue, nameValue]);
  useEffect(() => {
    if (!matchType) {
      setFieldValue('sinkBindingMatchType', 'labels');
    }
  }, [matchType, setFieldValue]);

  return (
    <FormSection title={title} extraMargin fullWidth={fullWidth} dataTest={`${title} section`}>
      <TertiaryHeading>{t('knative-plugin~Subject')}</TertiaryHeading>
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
      <FormGroup fieldId={fieldId} label={t('knative-plugin~Match subject')}>
        <div className="pf-v6-c-form__helper-text">
          {t('knative-plugin~Match subject using name or labels.')}
        </div>
        <div className="form-group">
          <DropdownField
            name="sinkBindingMatchType"
            items={{ name: t('knative-plugin~Name'), labels: t('knative-plugin~Labels') }}
            title={t('knative-plugin~Match type')}
          />
        </div>
        {matchType === 'name' ? (
          <InputField
            type={TextInputTypes.text}
            name={`formData.data.${EventSources.SinkBinding}.subject.name`}
            label={t('knative-plugin~Subject Name')}
            required
          />
        ) : (
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
        )}
      </FormGroup>
    </FormSection>
  );
};

export default SinkBindingSection;
