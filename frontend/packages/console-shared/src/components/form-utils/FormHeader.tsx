import * as React from 'react';
import { Title, FormHelperText } from '@patternfly/react-core';

type FormHeaderProps = {
  title: React.ReactNode;
  helpText?: React.ReactNode;
  flexLayout?: boolean;
};

const FormHeader: React.FC<FormHeaderProps> = ({ title, helpText, flexLayout }) => (
  <div style={flexLayout ? { marginBottom: 'var(--pf-global--spacer--lg)' } : {}}>
    <Title headingLevel="h1" size="2xl">
      {title}
    </Title>
    <FormHelperText isHidden={false} style={{ marginTop: 'var(--pf-global--spacer--xs)' }}>
      {helpText}
    </FormHelperText>
  </div>
);

export default FormHeader;
