import * as React from 'react';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { DropdownField } from '@console/shared';
import FormSection from '../../import/section/FormSection';
import { BuildConfigRunPolicy } from '../types';

export type PolicySectionFormData = {
  formData: {
    policy: {
      runPolicy?: BuildConfigRunPolicy;
    };
  };
};

const PolicySection: React.FC<{}> = () => {
  const { t } = useTranslation();
  const [{ value: runPolicy }] = useField<BuildConfigRunPolicy>('formData.policy.runPolicy');

  const typeItems: Record<BuildConfigRunPolicy, string> = {
    [BuildConfigRunPolicy.Serial]: t('devconsole~Serial'),
    [BuildConfigRunPolicy.Parallel]: t('devconsole~Parallel'),
    [BuildConfigRunPolicy.SerialLatestOnly]: t('devconsole~Serial latest only'),
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
      title={t('devconsole~Policy')}
      subTitle={t(
        'devconsole~The build run policy describes the order in which the builds created from the build configuration should run.',
      )}
      dataTest="section policy"
    >
      <DropdownField
        name="formData.policy.runPolicy"
        label={t('devconsole~Run policy')}
        title={typeItems[runPolicy || BuildConfigRunPolicy.Serial]}
        items={typeItems}
        helpText={helpText[runPolicy || BuildConfigRunPolicy.Serial]}
        dataTest="dropdown run-policy"
      />
    </FormSection>
  );
};

export default PolicySection;
