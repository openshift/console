import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';
import { ContainerModel } from '@console/internal/models';
import { ResourceLimitField } from '@console/shared';
import { MemoryUnits, CPUUnits } from '../import-types';
import FormSection from '../section/FormSection';

export type ResourceLimitSectionProps = {
  hideTitle?: boolean;
};

const ResourceLimitSection: React.FC<ResourceLimitSectionProps> = ({ hideTitle }) => {
  const { t } = useTranslation();
  const {
    values: {
      limits: { cpu, memory },
      container,
    },
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
        defaultUnitSize={`${cpu.defaultRequestUnit}`}
        helpText={t('devconsole~The minimum amount of CPU the Container is guaranteed.')}
      />

      <ResourceLimitField
        name="limits.cpu.limit"
        label={t('devconsole~Limit')}
        unitName="limits.cpu.limitUnit"
        unitOptions={CPUUnits}
        defaultUnitSize={`${cpu.defaultLimitUnit}`}
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
        defaultUnitSize={`${memory.defaultRequestUnit}`}
        helpText={t('devconsole~The minimum amount of Memory the Container is guaranteed.')}
      />

      <ResourceLimitField
        name="limits.memory.limit"
        label={t('devconsole~Limit')}
        unitName="limits.memory.limitUnit"
        unitOptions={MemoryUnits}
        defaultUnitSize={`${memory.defaultLimitUnit}`}
        helpText={t(
          'devconsole~The maximum amount of Memory the Container is allowed to use when running.',
        )}
      />
    </FormSection>
  );
};

export default ResourceLimitSection;
