import * as React from 'react';
import { Title } from '@patternfly/react-core';

type StepHeaderProps = {
  children: React.ReactNode;
};

const StepHeader: React.FCC<StepHeaderProps> = ({ children }) => (
  <Title headingLevel="h1" size="md" className="pf-v6-u-mb-sm">
    {children}
  </Title>
);

export default StepHeader;
