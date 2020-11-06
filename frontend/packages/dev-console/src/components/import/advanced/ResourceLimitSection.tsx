import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLimitField } from '@console/shared';
import { useFormikContext, FormikValues } from 'formik';
import FormSection from '../section/FormSection';
import { MemoryUnits, CPUUnits } from '../import-types';

const ResourceLimitSection: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      limits: { cpu, memory },
    },
  } = useFormikContext<FormikValues>();
  return (
    <FormSection title={t('devconsole~Resource Limit')}>
      <div className="co-section-heading-tertiary">{t('devconsole~CPU')}</div>
      <ResourceLimitField
        name="limits.cpu.request"
        label={t('devconsole~Request')}
        unitName="limits.cpu.requestUnit"
        unitOptions={CPUUnits}
        defaultUnitSize={`${cpu.defaultRequestUnit}`}
        helpText={t('devconsole~The minimum amount of CPU the container is guaranteed.')}
      />

      <ResourceLimitField
        name="limits.cpu.limit"
        label={t('devconsole~Limit')}
        unitName="limits.cpu.limitUnit"
        unitOptions={CPUUnits}
        defaultUnitSize={`${cpu.defaultLimitUnit}`}
        helpText={t(
          'devconsole~The maximum amount of CPU the container is allowed to use when running.',
        )}
      />

      <div className="co-section-heading-tertiary">Memory</div>
      <ResourceLimitField
        name="limits.memory.request"
        label={t('devconsole~Request')}
        unitName="limits.memory.requestUnit"
        unitOptions={MemoryUnits}
        defaultUnitSize={`${memory.defaultRequestUnit}`}
        helpText={t('devconsole~The minimum amount of Memory the container is guaranteed.')}
      />

      <ResourceLimitField
        name="limits.memory.limit"
        label={t('devconsole~Limit')}
        unitName="limits.memory.limitUnit"
        unitOptions={MemoryUnits}
        defaultUnitSize={`${memory.defaultLimitUnit}`}
        helpText={t(
          'devconsole~The maximum amount of Memory the container is allowed to use when running.',
        )}
      />
    </FormSection>
  );
};

export default ResourceLimitSection;
