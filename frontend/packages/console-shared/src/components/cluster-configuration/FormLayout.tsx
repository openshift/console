import * as React from 'react';
import { FormProps } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import formStyles from '@patternfly/react-styles/css/components/Form/form';

export type FormLayoutProps = Pick<FormProps, 'children' | 'isHorizontal' | 'isWidthLimited'>;

const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  isHorizontal = false,
  isWidthLimited = true,
}) => {
  return (
    <div
      className={css(
        formStyles.form,
        isHorizontal && formStyles.modifiers.horizontal,
        isWidthLimited && formStyles.modifiers.limitWidth,
      )}
    >
      {children}
    </div>
  );
};

export default FormLayout;
