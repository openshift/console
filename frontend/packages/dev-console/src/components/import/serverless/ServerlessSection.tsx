import * as React from 'react';
import { connectToFlags } from '@console/internal/reducers/features';
import {
  FLAG_KNATIVE_SERVING_SERVICE_ALPHA,
  FLAG_KNATIVE_SERVING_SERVICE_BETA,
} from '@console/knative-plugin';
import { TechPreviewBadge } from '@console/shared';
import { Split, SplitItem } from '@patternfly/react-core';
import { CheckboxField } from '../../formik-fields';
import FormSection from '../section/FormSection';

type ServerlessSectionProps = {
  flags: { [key: string]: boolean };
};

const ServerlessSectionAlpha: React.FC<ServerlessSectionProps> = ({ flags }) => {
  if (flags[FLAG_KNATIVE_SERVING_SERVICE_ALPHA]) {
    const title = (
      <Split gutter="md">
        <SplitItem className="odc-form-section__heading">Serverless</SplitItem>
        <SplitItem>
          <TechPreviewBadge />
        </SplitItem>
      </Split>
    );
    return (
      <FormSection title={title}>
        <CheckboxField label="Enable scaling to zero when idle" name="serverless.enabled" />
      </FormSection>
    );
  }

  return null;
};

const ServerlessSectionBeta: React.FC<ServerlessSectionProps> = ({ flags }) => {
  if (flags[FLAG_KNATIVE_SERVING_SERVICE_BETA]) {
    const title = (
      <Split gutter="md">
        <SplitItem className="odc-form-section__heading">Serverless</SplitItem>
        <SplitItem>
          <TechPreviewBadge />
        </SplitItem>
      </Split>
    );
    return (
      <FormSection title={title}>
        <CheckboxField label="Enable scaling to zero when idle" name="serverless.enabled" />
      </FormSection>
    );
  }

  return null;
};

export connectToFlags(FLAG_KNATIVE_SERVING_SERVICE_ALPHA)(ServerlessSectionAlpha);
export connectToFlags(FLAG_KNATIVE_SERVING_SERVICE_BETA)(ServerlessSectionBeta);
