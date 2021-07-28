import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { EnvironmentField } from '@console/shared/src';
import FormSection from '../import/section/FormSection';
import ContainerField from './ContainerField';

const EnvironmentVariablesSection: React.FC<{ resourceObj: K8sResourceKind }> = ({
  resourceObj,
}) => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { envs },
    },
  } = useFormikContext<FormikValues>();
  return (
    <FormSection
      title={t('devconsole~Environment Variables')}
      dataTest="environment-variables-section"
    >
      <ContainerField />
      <EnvironmentField
        name="formData.envs"
        envs={envs ?? []}
        obj={resourceObj}
        envPath={['spec', 'template', 'spec', 'containers']}
      />
    </FormSection>
  );
};

export default EnvironmentVariablesSection;
