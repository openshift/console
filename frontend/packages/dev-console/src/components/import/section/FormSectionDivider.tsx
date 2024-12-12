import * as React from 'react';

const FormSectionDivider: React.FC = () => (
  <hr
    style={{
      margin: 0,
      borderBottom:
        'var(--pf-t--temp--dev--tbd)' /* CODEMODS: original v5 color was --pf-v5-global--Color--400 */,
      width: '100%',
    }}
  />
);

export default FormSectionDivider;
