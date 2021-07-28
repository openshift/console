import * as React from 'react';
import { FormHelperText } from '@patternfly/react-core';
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
}

const flexStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  margin: 'var(--pf-global--spacer--md) 0',
};

const FormSection: React.FC<FormSectionProps> = ({
  title,
  subTitle,
  fullWidth,
  children,
  flexLayout,
  extraMargin,
  dataTest,
}) => (
  <div
    className={cx('pf-c-form', {
      'co-m-pane__form': !fullWidth,
      'odc-form-section--extra-margin': extraMargin,
    })}
    style={flexLayout ? flexStyle : {}}
    data-test={dataTest}
  >
    {title && <h2 className="odc-form-section__heading">{title}</h2>}
    {subTitle && <FormHelperText isHidden={false}>{subTitle}</FormHelperText>}
    {children}
  </div>
);

export default FormSection;
