import type { FC } from 'react';

const FormSectionDivider: FC = () => (
  <hr
    style={{
      margin: 0,
      borderBottom: 'var(--pf-t--global--border--color--default)',
      width: '100%',
    }}
  />
);

export default FormSectionDivider;
