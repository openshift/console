import type { ReactNode, CSSProperties, HTMLProps, FC } from 'react';
import { css } from '@patternfly/react-styles';

type FormBodyProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  flexLayout?: boolean;
  disablePaneBody?: boolean;
};

export const FormBody: FC<FormBodyProps & HTMLProps<HTMLDivElement>> = ({
  children,
  className,
  style,
  disablePaneBody = false,
  flexLayout = false,
  ...props
}) => (
  <div
    {...props}
    className={css(
      'pf-v6-c-form',
      { 'pf-v6-c-page__main-section pf-m-fill': !disablePaneBody },
      className,
    )}
    style={
      flexLayout
        ? { display: 'flex', flex: 1, flexDirection: 'column', ...(style ?? {}) }
        : style ?? {}
    }
  >
    {children}
  </div>
);
