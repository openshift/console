import * as React from 'react';
import { HelpBlock } from 'patternfly-react';

export interface FormSectionHeadingProps {
  title: string;
}

const FormSectionSubHeading = ({ subTitle }) => (
  <HelpBlock style={{ marginBottom: 'var(--pf-global--spacer--sm)' }}>{subTitle}</HelpBlock>
);

export default FormSectionSubHeading;
