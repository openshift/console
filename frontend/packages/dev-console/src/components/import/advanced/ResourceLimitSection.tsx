import * as React from 'react';
import { ResourceLimitField } from '@console/shared';
import { useField } from 'formik';
import FormSection from '../section/FormSection';
import { MemoryUnits, CPUUnits } from '../import-types';

const ResourceLimitSection: React.FC = () => {
  const [cpuLimits] = useField('limits.cpu');
  const [memoryLimits] = useField('limits.memory');
  return (
    <FormSection title="Resource Limit">
      <div className="co-section-heading-tertiary">CPU</div>
      <ResourceLimitField
        name="limits.cpu.request"
        label="Request"
        unitName="limits.cpu.requestUnit"
        unitOptions={CPUUnits}
        defaultUnitSize={`${cpuLimits.value.defaultRequestUnit}`}
        helpText="The minimum amount of CPU the container is guaranteed."
      />

      <ResourceLimitField
        name="limits.cpu.limit"
        label="Limit"
        unitName="limits.cpu.limitUnit"
        unitOptions={CPUUnits}
        defaultUnitSize={`${cpuLimits.value.defaultLimitUnit}`}
        helpText="The maximum amount of CPU the container is allowed to use when running."
      />

      <div className="co-section-heading-tertiary">Memory</div>
      <ResourceLimitField
        name="limits.memory.request"
        label="Request"
        unitName="limits.memory.requestUnit"
        unitOptions={MemoryUnits}
        defaultUnitSize={`${memoryLimits.value.defaultRequestUnit}`}
        helpText="The minimum amount of Memory the container is guaranteed."
      />

      <ResourceLimitField
        name="limits.memory.limit"
        label="Limit"
        unitName="limits.memory.limitUnit"
        unitOptions={MemoryUnits}
        defaultUnitSize={`${memoryLimits.value.defaultLimitUnit}`}
        helpText="The maximum amount of Memory the container is allowed to use when running."
      />
    </FormSection>
  );
};

export default ResourceLimitSection;
