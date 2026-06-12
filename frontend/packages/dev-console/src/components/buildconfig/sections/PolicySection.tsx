import type { FC } from 'react';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { DropdownField } from '@console/shared/src/components/formik-fields/DropdownField';
import FormSection from '../../import/section/FormSection';
import { BuildConfigRunPolicy } from '../types';

export type PolicySectionFormData = {
  formData: {
    policy: {
      runPolicy?: BuildConfigRunPolicy;
    };
  };
};

const PolicySection: FC<{}> = () => {
  const { t } = useTranslation('devconsole');
  const [{ value: runPolicy }] = useField<BuildConfigRunPolicy>('formData.policy.runPolicy');

  const typeItems: Record<BuildConfigRunPolicy, string> = {
    [BuildConfigRunPolicy.Serial]: t('Serial'),
    [BuildConfigRunPolicy.Parallel]: t('Parallel'),
    [BuildConfigRunPolicy.SerialLatestOnly]: t('Serial latest only'),
  };

  const helpText: Record<BuildConfigRunPolicy, string> = {
    [BuildConfigRunPolicy.Serial]: t(
      'devconsole~Builds triggered from this Build Configuration will run one at the time, in the order they have been triggered.',
    ),
    [BuildConfigRunPolicy.Parallel]: t(
      'devconsole~Builds triggered from this Build Configuration will run all at the same time. The order in which they will finish is not guaranteed.',
    ),
    [BuildConfigRunPolicy.SerialLatestOnly]: t(
      'devconsole~Builds triggered from this Build Configuration will run one at the time. When a currently running build completes, the next build that will run is the latest build created. Other queued builds will be cancelled.',
    ),
  };

  return (
    <FormSection
      title={t('Policy')}
      subTitle={t(
        'devconsole~The build run policy describes the order in which the builds created from the build configuration should run.',
      )}
      dataTest="section policy"
    >
      <DropdownField
        name="formData.policy.runPolicy"
        label={t('Run policy')}
        title={typeItems[runPolicy || BuildConfigRunPolicy.Serial]}
        items={typeItems}
        helpText={helpText[runPolicy || BuildConfigRunPolicy.Serial]}
        dataTest="dropdown run-policy"
      />
    </FormSection>
  );
};

export default PolicySection;
