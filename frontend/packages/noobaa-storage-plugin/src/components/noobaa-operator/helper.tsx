import * as React from 'react';
import { Alert } from '@patternfly/react-core';

const HelpText: React.FC<HelpTextProps> = ({ title, children }) => (
  <Alert title={title} isInline>
    {children}
  </Alert>
);

type HelpTextProps = {
  title: string;
  children: React.ReactNode;
};

export default HelpText;
