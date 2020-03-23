import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';

const CronJobSection: React.FC = () => (
  <FormSection title="CronJobSource">
    <InputField type={TextInputTypes.text} name="data.cronjobsource.data" label="Data" required />
    <InputField
      type={TextInputTypes.text}
      name="data.cronjobsource.schedule"
      label="Schedule"
      required
    />
  </FormSection>
);

export default CronJobSection;
