import * as React from 'react';

type FlexFormProps = {
  children?: React.ReactNode;
};

const FlexForm: React.FC<FlexFormProps & React.HTMLProps<HTMLFormElement>> = ({
  children,
  ...props
}) => (
  <form {...props} style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
    {children}
  </form>
);

export default FlexForm;
