import * as React from 'react';
import classNames from 'classnames';

type FormBodyProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  flexLayout?: boolean;
  disablePaneBody?: boolean;
};

const FormBody: React.FC<FormBodyProps & React.HTMLProps<HTMLDivElement>> = ({
  children,
  className,
  style,
  disablePaneBody = false,
  flexLayout = false,
  ...props
}) => (
  <div
    {...props}
    className={classNames(
      'pf-v6-c-form',
      { 'pf-v6-c-page__main-section': !disablePaneBody },
      className,
    )}
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
