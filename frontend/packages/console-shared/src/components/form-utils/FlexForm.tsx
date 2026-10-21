import type { ReactNode, HTMLProps, FC } from 'react';

type FlexFormProps = {
  children?: ReactNode;
};

const FlexForm: FC<FlexFormProps & HTMLProps<HTMLFormElement>> = ({ children, ...props }) => (
  <form {...props} style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
    {children}
  </form>
);

export default FlexForm;
