import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import ApplicationSelector from '@console/dev-console/src/components/import/app/ApplicationSelector';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField } from '@console/shared';

type DefaultChannelSectionProps = {
  namespace: string;
};

const DefaultChannelSection: React.FC<DefaultChannelSectionProps> = ({ namespace }) => (
  <FormSection extraMargin>
    <ApplicationSelector namespace={namespace} />
    <InputField
      type={TextInputTypes.text}
      data-test-id="channel-name"
      name="name"
      label="Name"
      helpText="A unique name for the component/channel"
      required
    />
  </FormSection>
);

export default DefaultChannelSection;
