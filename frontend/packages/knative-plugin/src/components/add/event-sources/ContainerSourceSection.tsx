import type { FC } from 'react';
import { useState, useCallback } from 'react';
import {
  TextInputTypes,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { getSuggestedName } from '@console/dev-console/src/utils/imagestream-utils';
import { AsyncComponent } from '@console/internal/components/utils';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { TextColumnField } from '@console/shared/src/components/formik-fields/text-column-field/TextColumnField';
import TertiaryHeading from '@console/shared/src/components/heading/TertiaryHeading';
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

const ContainerSourceSection: FC<ContainerSourceSectionProps> = ({ title, fullWidth }) => {
  const { t } = useTranslation('knative-plugin');
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
  const [nameValue, setNameValue] = useState(initialEnvValues);
  const handleNameValuePairs = useCallback(
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
    <FormSection title={title} extraMargin fullWidth={fullWidth} dataTest={`${title} section`}>
      <TertiaryHeading>{t('Container')}</TertiaryHeading>
      <InputField
        data-test-id="container-image-field"
        type={TextInputTypes.text}
        name={containerPaths.Image}
        label={t('Image')}
        helpText={t('The Image to run inside of the Container')}
        required
        onChange={(e) => {
          setFieldValue(containerPaths.Name, getSuggestedName(e.target.value));
        }}
      />
      <InputField
        data-test-id="container-name-field"
        type={TextInputTypes.text}
        name={containerPaths.Name}
        label={t('Name')}
        helpText={t('The name of the Image')}
      />
      <TextColumnField
        data-test-id="container-arg-field"
        name={containerPaths.Args}
        label={t('Arguments')}
        addLabel={t('Add args')}
        placeholder={t('argument')}
        helpText={t('Arguments passed to the Container')}
        disableDeleteRow={args?.length === 1}
      />
      <FormGroup fieldId="containersource-env" label={t('Environment variables')}>
        <AsyncComponent
          loader={() =>
            import('@console/internal/components/utils/name-value-editor').then(
              (c) => c.NameValueEditor,
            )
          }
          data-test-id="container-env-field"
          nameValuePairs={nameValue}
          valueString={t('Value')}
          nameString={t('Name')}
          readOnly={false}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
          addString={t('Add more')}
        />

        <FormHelperText>
          <HelperText>
            <HelperTextItem>{t('The list of variables to set in the Container.')}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </FormSection>
  );
};

export default ContainerSourceSection;
