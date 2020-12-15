import * as React from 'react';
import cx from 'classnames';
import { FormHelperText } from '@patternfly/react-core';
import './FormSection.scss';

export interface FormSectionProps {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
  flexLayout?: boolean;
  extraMargin?: boolean;
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
}) => (
  <div
    className={cx('pf-c-form', {
      'co-m-pane__form': !fullWidth,
      'odc-form-section--extra-margin': extraMargin,
    })}
    style={flexLayout ? flexStyle : {}}
  >
    {title && <h2 className="odc-form-section__heading">{title}</h2>}
    {subTitle && <FormHelperText isHidden={false}>{subTitle}</FormHelperText>}
    {children}
  </div>
);

export default FormSection;
