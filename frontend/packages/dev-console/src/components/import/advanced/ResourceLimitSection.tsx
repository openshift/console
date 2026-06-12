import type { FC } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';
import { ContainerModel } from '@console/internal/models';
import { ResourceLimitField } from '@console/shared/src/components/formik-fields/ResourceLimitField';
import TertiaryHeading from '@console/shared/src/components/heading/TertiaryHeading';
import { MemoryUnits, CPUUnits } from '../import-types';
import FormSection from '../section/FormSection';

type ResourceLimitSectionProps = {
  hideTitle?: boolean;
};

const ResourceLimitSection: FC<ResourceLimitSectionProps> = ({ hideTitle }) => {
  const { t } = useTranslation('devconsole');
  const {
    values: { container },
  } = useFormikContext<FormikValues>();
  return (
    <FormSection
      title={!hideTitle && t('Resource limit')}
      subTitle={t(
        'Resource limits control how much CPU and memory a container will consume on a node.',
      )}
      fullWidth
    >
      {container && (
        <span data-test="ResourceLimitSection-container-heading">
          {t('Container')} &nbsp;
          <ResourceIcon kind={ContainerModel.kind} /> {container}
        </span>
      )}
      <TertiaryHeading altSpacing="pf-v6-u-my-0">{t('CPU')}</TertiaryHeading>
      <ResourceLimitField
        name="limits.cpu.request"
        label={t('Request')}
        inputAriaLabel={t('CPU request')}
        unitName="limits.cpu.requestUnit"
        unitOptions={CPUUnits}
        helpText={t('The minimum amount of CPU the Container is guaranteed.')}
      />

      <ResourceLimitField
        name="limits.cpu.limit"
        label={t('Limit')}
        inputAriaLabel={t('CPU limit')}
        unitName="limits.cpu.limitUnit"
        unitOptions={CPUUnits}
        helpText={t('The maximum amount of CPU the Container is allowed to use when running.')}
      />

      <TertiaryHeading altSpacing="pf-v6-u-my-0">{t('Memory')}</TertiaryHeading>
      <ResourceLimitField
        name="limits.memory.request"
        label={t('Request')}
        inputAriaLabel={t('Memory request')}
        unitName="limits.memory.requestUnit"
        unitOptions={MemoryUnits}
        helpText={t('The minimum amount of Memory the Container is guaranteed.')}
      />

      <ResourceLimitField
        name="limits.memory.limit"
        label={t('Limit')}
        inputAriaLabel={t('Memory limit')}
        unitName="limits.memory.limitUnit"
        unitOptions={MemoryUnits}
        helpText={t('The maximum amount of Memory the Container is allowed to use when running.')}
      />
    </FormSection>
  );
};

export default ResourceLimitSection;
