import * as React from 'react';
import { connectToFlags } from '@console/internal/reducers/features';
import { FLAG_KNATIVE_SERVING } from '@console/knative-plugin';
import { TechPreviewBadge } from '@console/shared';
import FormSection from '../section/FormSection';
import { CheckboxField } from '../../formik-fields';

type ServerlessSectionProps = {
  flags: { [key: string]: boolean };
};

const ServerlessSection: React.FC<ServerlessSectionProps> = ({ flags }) => {
  if (flags[FLAG_KNATIVE_SERVING]) {
    return (
      <FormSection title="Serverless Options">
        <TechPreviewBadge />
        <CheckboxField label="Enable scaling to zero when idle" name="serverless.enabled" />
      </FormSection>
    );
  }

  return null;
};

export default connectToFlags(FLAG_KNATIVE_SERVING)(ServerlessSection);
