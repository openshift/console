import type { ReactNode, CSSProperties, HTMLProps, FC } from 'react';
import { css } from '@patternfly/react-styles';

type FormBodyProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  flexLayout?: boolean;
  disablePaneBody?: boolean;
};

const FormBody: FC<FormBodyProps & HTMLProps<HTMLDivElement>> = ({
  children,
  className,
  style,
  disablePaneBody = false,
  flexLayout = false,
  ...props
}) => (
  <div
    {...props}
    className={css('pf-v6-c-form', { 'pf-v6-c-page__main-section': !disablePaneBody }, className)}
    style={
      flexLayout
        ? { display: 'flex', flex: 1, flexDirection: 'column', paddingBottom: 0, ...(style ?? {}) }
        : { paddingBottom: 0, ...(style ?? {}) }
    }
  >
    {children}
  </div>
);

export default FormBody;
