import * as React from 'react';
import FormSectionHeading from './FormSectionHeading';
import FormSectionDivider from './FormSectionDivider';
import FormSectionSubHeading from './FormSectionSubHeading';

export interface FormSectionProps {
  title: string;
  subTitle?: string;
  divider?: boolean;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, subTitle, divider, children }) => (
  <React.Fragment>
    <FormSectionHeading title={title} />
    {subTitle && <FormSectionSubHeading subTitle={subTitle} />}
    {children}
    {divider && <FormSectionDivider />}
  </React.Fragment>
);

export default FormSection;
