import type { FC } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { EnvironmentField } from '@console/shared/src';
import FormSection from '../import/section/FormSection';
import ContainerField from './ContainerField';

const EnvironmentVariablesSection: FC<{ resourceObj: K8sResourceKind }> = ({ resourceObj }) => {
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
      <EnvironmentField name="formData.envs" envs={envs} obj={resourceObj} />
    </FormSection>
  );
};

export default EnvironmentVariablesSection;
