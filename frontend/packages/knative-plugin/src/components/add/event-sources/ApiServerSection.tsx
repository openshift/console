import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { DropdownField, getFieldId } from '@console/shared';
import ServiceAccountDropdown from '../../dropdowns/ServiceAccountDropdown';
import { EventSources } from '../import-types';

interface ApiServerSectionProps {
  title: string;
  fullWidth?: boolean;
}

const ApiServerSection: React.FC<ApiServerSectionProps> = ({ title, fullWidth }) => {
  const { t } = useTranslation();
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const defaultInitvalue = values?.formData?.data?.[EventSources.ApiServerSource] || {};
  const initVal = defaultInitvalue?.resources || [];
  const initialValueResources = !_.isEmpty(initVal)
    ? initVal.map((val) => _.values(val))
    : [['', '']];
  const [nameValue, setNameValue] = React.useState(initialValueResources);
  const handleNameValuePairs = React.useCallback(
    ({ nameValuePairs }) => {
      const updatedNameValuePairs = _.compact(
        nameValuePairs.map(([name, value]) => {
          if (value.length) {
            return { apiVersion: name, kind: value };
          }
          return null;
        }),
      );
      setNameValue(nameValuePairs);
      setFieldValue(
        `formData.data.${EventSources.ApiServerSource}.resources`,
        updatedNameValuePairs,
      );
    },
    [setFieldValue],
  );
  const modeItems = {
    Reference: 'Reference',
    Resource: 'Resource',
  };
  const fieldId = getFieldId(values.type, 'res-input');
  const onloadData = (items) => {
    if (
      defaultInitvalue?.serviceAccountName &&
      !Object.keys(items).includes(defaultInitvalue.serviceAccountName)
    ) {
      setFieldValue(`formData.data.${EventSources.ApiServerSource}.serviceAccountName`, '');
      setFieldTouched(`formData.data.${EventSources.ApiServerSource}.serviceAccountName`, true);
    }
  };
  return (
    <FormSection title={title} extraMargin fullWidth={fullWidth}>
      <FormGroup
        fieldId={fieldId}
        label={t('knative-plugin~Resource')}
        helperText={t('knative-plugin~The list of resources to watch')}
        isRequired
      >
        <AsyncComponent
          loader={() =>
            import('@console/internal/components/utils/name-value-editor').then(
              (c) => c.NameValueEditor,
            )
          }
          nameValuePairs={nameValue}
          valueString="kind"
          nameString="apiVersion"
          addString={t('knative-plugin~Add resource')}
          readOnly={false}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
        />
      </FormGroup>
      <DropdownField
        name={`formData.data.${EventSources.ApiServerSource}.mode`}
        label={t('knative-plugin~Mode')}
        items={modeItems}
        title={modeItems.Reference}
        helpText={t('knative-plugin~The mode the receive adapter controller runs under')}
        fullWidth
      />
      <ServiceAccountDropdown
        name={`formData.data.${EventSources.ApiServerSource}.serviceAccountName`}
        onLoad={onloadData}
      />
    </FormSection>
  );
};

export default ApiServerSection;
