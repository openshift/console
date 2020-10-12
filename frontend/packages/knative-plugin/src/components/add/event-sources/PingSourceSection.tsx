import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { EventSources } from '../import-types';

interface PingSourceSectionProps {
  title: string;
}

const PingSourceSection: React.FC<PingSourceSectionProps> = ({ title }) => (
  <FormSection title={title} extraMargin>
    <InputField
      type={TextInputTypes.text}
      name={`data.${EventSources.PingSource}.jsonData`}
      label="Data"
      helpText="The data posted to the target function"
    />
    <InputField
      type={TextInputTypes.text}
      name={`data.${EventSources.PingSource}.schedule`}
      label="Schedule"
      helpText="Schedule is described using the unix-cron string format (* * * * *)"
      required
    />
  </FormSection>
);

export default PingSourceSection;
