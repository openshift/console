import type { ReactNode, FC } from 'react';
import { Title, FormHelperText } from '@patternfly/react-core';

type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

type FormHeaderProps = {
  title: ReactNode;
  helpText?: ReactNode;
  marginTop?: SpacerSize;
  marginBottom?: SpacerSize;
};

const FormHeader: FC<FormHeaderProps> = ({ title, helpText, marginTop, marginBottom }) => {
  const marginStyles = {
    ...(marginTop ? { marginTop: `var(--pf-t--global--spacer--${marginTop})` } : {}),
    ...(marginBottom ? { marginBottom: `var(--pf-t--global--spacer--${marginBottom})` } : {}),
  };

  return (
    <div style={marginStyles}>
      <Title headingLevel="h1" size="2xl" data-test="form-title">
        {title}
      </Title>
      <FormHelperText style={{ marginTop: 'var(--pf-t--global--spacer--xs)' }}>
        {helpText}
      </FormHelperText>
    </div>
  );
};

export default FormHeader;
