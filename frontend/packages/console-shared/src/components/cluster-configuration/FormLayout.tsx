import type { FC } from 'react';
import type { FormProps } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import formStyles from '@patternfly/react-styles/css/components/Form/form';
import { useTranslation } from 'react-i18next';

export type FormLayoutProps = Pick<FormProps, 'children' | 'isHorizontal' | 'isWidthLimited'>;

export const FormLayout: FC<FormLayoutProps> = ({
  children,
  isHorizontal = false,
  isWidthLimited = true,
}) => {
  const { t } = useTranslation('console-shared');
  return (
    <div
      role="region"
      aria-label={t('Form layout')}
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
