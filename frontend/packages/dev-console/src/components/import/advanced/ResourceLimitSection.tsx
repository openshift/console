import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues } from 'formik';
import { ResourceLimitField } from '@console/shared';
import { ResourceIcon } from '@console/internal/components/utils';
import { ContainerModel } from '@console/internal/models';
import FormSection from '../section/FormSection';
import { MemoryUnits, CPUUnits } from '../import-types';

export type ResourceLimitSectionProps = {
  hideTitle?: boolean;
};

const ResourceLimitSection: React.FC<ResourceLimitSectionProps> = ({ hideTitle }) => {
  const { t } = useTranslation();
  const {
    values: { container },
  } = useFormikContext<FormikValues>();
  return (
    <FormSection
      title={!hideTitle && t('devconsole~Resource limit')}
      subTitle={t(
        'devconsole~Resource limits control how much CPU and memory a container will consume on a node.',
      )}
      fullWidth
    >
      {container && (
        <span>
          {t('devconsole~Container')} &nbsp;
          <ResourceIcon kind={ContainerModel.kind} /> {container}
        </span>
      )}
      <div className="co-section-heading-tertiary">{t('devconsole~CPU')}</div>
      <ResourceLimitField
        name="limits.cpu.request"
        label={t('devconsole~Request')}
        unitName="limits.cpu.requestUnit"
        unitOptions={CPUUnits}
        helpText={t('devconsole~The minimum amount of CPU the Container is guaranteed.')}
      />

      <ResourceLimitField
        name="limits.cpu.limit"
        label={t('devconsole~Limit')}
        unitName="limits.cpu.limitUnit"
        unitOptions={CPUUnits}
        helpText={t(
          'devconsole~The maximum amount of CPU the Container is allowed to use when running.',
        )}
      />

      <div className="co-section-heading-tertiary">{t('devconsole~Memory')}</div>
      <ResourceLimitField
        name="limits.memory.request"
        label={t('devconsole~Request')}
        unitName="limits.memory.requestUnit"
        unitOptions={MemoryUnits}
        helpText={t('devconsole~The minimum amount of Memory the Container is guaranteed.')}
      />

      <ResourceLimitField
        name="limits.memory.limit"
        label={t('devconsole~Limit')}
        unitName="limits.memory.limitUnit"
        unitOptions={MemoryUnits}
        helpText={t(
          'devconsole~The maximum amount of Memory the Container is allowed to use when running.',
        )}
      />
    </FormSection>
  );
};

export default ResourceLimitSection;
