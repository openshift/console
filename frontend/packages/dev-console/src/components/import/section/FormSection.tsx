import * as React from 'react';
import cx from 'classnames';
import { SectionHeading } from '@console/internal/components/utils';
import { FormHelperText } from '@patternfly/react-core';

export interface FormSectionProps {
  title?: string;
  subTitle?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, subTitle, fullWidth, children }) => (
  <div className={cx('pf-c-form', { 'co-m-pane__form': !fullWidth })}>
    {title && (
      <SectionHeading
        text={title}
        style={{ margin: 0, fontWeight: 'var(--pf-global--FontWeight--semi-bold)' }}
      />
    )}
    {subTitle && <FormHelperText isHidden={false}>{subTitle}</FormHelperText>}
    {children}
  </div>
);

export default FormSection;
