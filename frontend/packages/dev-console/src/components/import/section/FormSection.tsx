import * as React from 'react';
import { FormHelperText, Title } from '@patternfly/react-core';
import cx from 'classnames';
import './FormSection.scss';

export interface FormSectionProps {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
  flexLayout?: boolean;
  extraMargin?: boolean;
  dataTest?: string;
  style?: React.CSSProperties;
}

const flexStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  margin: 'var(--pf-t--global--spacer--md)',
};

const FormSection: React.FC<FormSectionProps> = ({
  title,
  subTitle,
  fullWidth,
  children,
  flexLayout,
  extraMargin,
  dataTest,
  style,
}) => (
  <div
    className={cx('pf-v6-c-form', {
      'co-m-pane__form': !fullWidth,
      'odc-form-section--extra-margin': extraMargin,
    })}
    style={{ ...(flexLayout ? flexStyle : {}), ...(style || {}) }}
    data-test={dataTest}
  >
    {title && (
      <Title headingLevel="h2" className="odc-form-section__heading">
        {title}
      </Title>
    )}
    {subTitle && <FormHelperText>{subTitle}</FormHelperText>}
    {children}
  </div>
);

export default FormSection;
