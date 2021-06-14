import * as React from 'react';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { getSuggestedName } from '@console/dev-console/src/utils/imagestream-utils';
import { AsyncComponent } from '@console/internal/components/utils';
import { InputField, TextColumnField } from '@console/shared';
import { EventSources } from '../import-types';

const templateSpec = `formData.data.${EventSources.ContainerSource}.template.spec.containers[0]`;
const containerPaths = {
  Image: `${templateSpec}.image`,
  Name: `${templateSpec}.name`,
  Env: `${templateSpec}.env`,
  Args: `${templateSpec}.args`,
};

interface ContainerSourceSectionProps {
  title: string;
  fullWidth?: boolean;
}

const ContainerSourceSection: React.FC<ContainerSourceSectionProps> = ({ title, fullWidth }) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const {
    formData: {
      data: {
        [EventSources.ContainerSource]: {
          template: {
            spec: {
              containers: [{ env: envs, args }],
            },
          },
        },
      },
    },
  } = values;
  const initialEnvValues = !_.isEmpty(envs) ? _.map(envs, (env) => _.values(env)) : [['', '']];
  const [nameValue, setNameValue] = React.useState(initialEnvValues);
  const handleNameValuePairs = React.useCallback(
    ({ nameValuePairs }) => {
      const updatedNameValuePairs = _.compact(
        nameValuePairs.map(([name, value]) => (value.length ? { name, value } : null)),
      );
      setNameValue(nameValuePairs);
      setFieldValue(containerPaths.Env, updatedNameValuePairs);
    },
    [setFieldValue],
  );
  return (
    <FormSection title={title} extraMargin fullWidth={fullWidth}>
      <h3 className="co-section-heading-tertiary">{t('knative-plugin~Container')}</h3>
      <InputField
        data-test-id="container-image-field"
        type={TextInputTypes.text}
        name={containerPaths.Image}
        label={t('knative-plugin~Image')}
        helpText={t('knative-plugin~The Image to run inside of the Container')}
        required
        onChange={(e) => {
          setFieldValue(containerPaths.Name, getSuggestedName(e.target.value));
        }}
      />
      <InputField
        data-test-id="container-name-field"
        type={TextInputTypes.text}
        name={containerPaths.Name}
        label={t('knative-plugin~Name')}
        helpText={t('knative-plugin~The name of the Image')}
      />
      <TextColumnField
        data-test-id="container-arg-field"
        name={containerPaths.Args}
        label={t('knative-plugin~Arguments')}
        addLabel={t('knative-plugin~Add args')}
        placeholder={t('knative-plugin~argument')}
        helpText={t('knative-plugin~Arguments passed to the Container')}
        disableDeleteRow={args?.length === 1}
      />
      <FormGroup
        fieldId="containersource-env"
        label={t('knative-plugin~Environment variables')}
        helperText={t('knative-plugin~The list of variables to set in the Container')}
      >
        <AsyncComponent
          loader={() =>
            import('@console/internal/components/utils/name-value-editor').then(
              (c) => c.NameValueEditor,
            )
          }
          data-test-id="container-env-field"
          nameValuePairs={nameValue}
          valueString={t('knative-plugin~Value')}
          nameString={t('knative-plugin~Name')}
          readOnly={false}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
          addLabel={t('knative-plugin~Add more')}
        />
      </FormGroup>
    </FormSection>
  );
};

export default ContainerSourceSection;
