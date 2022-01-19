import * as React from 'react';
import classnames from 'classnames';

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
  inputMode,
  style,
  disablePaneBody = false,
  flexLayout = false,
  ...props
}) => (
  <div
    {...props}
    // eslint-disable-next-line @typescript-eslint/naming-convention
    className={classnames('pf-c-form', { 'co-m-pane__body': !disablePaneBody }, className)}
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
