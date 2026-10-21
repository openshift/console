import type { ReactNode, CSSProperties, FC } from 'react';
import { FormHelperText, Title } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import './FormSection.scss';

export interface FormSectionProps {
  title?: ReactNode;
  subTitle?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
  flexLayout?: boolean;
  extraMargin?: boolean;
  dataTest?: string;
  style?: CSSProperties;
}

const flexStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  margin: 'var(--pf-t--global--spacer--md)',
};

const FormSection: FC<FormSectionProps> = ({
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
    className={css('pf-v6-c-form', {
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
