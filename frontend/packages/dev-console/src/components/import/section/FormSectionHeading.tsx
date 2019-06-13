import * as React from 'react';
import { SectionHeading } from '@console/internal/components/utils';

export interface FormSectionHeadingProps {
  title: string;
}

const FormSectionHeading: React.FC<FormSectionHeadingProps> = ({ title }) => (
  <SectionHeading
    text={title}
    style={{
      marginTop: 'var(--pf-global--spacer--lg)',
      fontWeight: 'var(--pf-global--FontWeight--semi-bold)',
    }}
  />
);

export default FormSectionHeading;
