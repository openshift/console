import * as React from 'react';
import FormSection from '../section/FormSection';
import { ResourceLimitField } from '../../formik-fields';
import { MemoryUnits, CPUUnits } from '../import-types';

const ResourceLimitSection: React.FC = () => {
  return (
    <FormSection title="Resource Limit">
      <div className="co-section-heading-tertiary">CPU</div>
      <ResourceLimitField
        name="limits.cpu.request"
        unitName="limits.cpu.requestUnit"
        inputLabel="Request"
        unitItems={CPUUnits}
        unitSelectedKey="m"
        helpText="The minimum amount of CPU the container is guaranteed."
      />

      <ResourceLimitField
        name="limits.cpu.limit"
        unitName="limits.cpu.limitUnit"
        inputLabel="Limit"
        unitItems={CPUUnits}
        unitSelectedKey="m"
        helpText="The maximum amount of CPU the container is allowed to use when running."
      />

      <div className="co-section-heading-tertiary">Memory</div>
      <ResourceLimitField
        name="limits.memory.request"
        unitName="limits.memory.requestUnit"
        inputLabel="Request"
        unitItems={MemoryUnits}
        unitSelectedKey="Mi"
        helpText="The minimum amount of Memory the container is guaranteed."
      />

      <ResourceLimitField
        name="limits.memory.limit"
        unitName="limits.memory.limitUnit"
        inputLabel="Limit"
        unitItems={MemoryUnits}
        unitSelectedKey="Mi"
        helpText="The maximum amount of Memory the container is allowed to use when running."
      />
    </FormSection>
  );
};

export default ResourceLimitSection;
