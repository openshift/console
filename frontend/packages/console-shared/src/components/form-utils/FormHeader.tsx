import * as React from 'react';
import { Title, FormHelperText } from '@patternfly/react-core';

type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

type FormHeaderProps = {
  title: React.ReactNode;
  helpText?: React.ReactNode;
  marginTop?: SpacerSize;
  marginBottom?: SpacerSize;
};

const FormHeader: React.FC<FormHeaderProps> = ({ title, helpText, marginTop, marginBottom }) => {
  const marginStyles = {
    ...(marginTop ? { marginTop: `var(--pf-global--spacer--${marginTop})` } : {}),
    ...(marginBottom ? { marginBottom: `var(--pf-global--spacer--${marginBottom})` } : {}),
  };

  return (
    <div style={marginStyles}>
      <Title headingLevel="h1" size="2xl">
        {title}
      </Title>
      <FormHelperText isHidden={false} style={{ marginTop: 'var(--pf-global--spacer--xs)' }}>
        {helpText}
      </FormHelperText>
    </div>
  );
};

export default FormHeader;
