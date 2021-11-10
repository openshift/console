import * as React from 'react';
import classnames from 'classnames';

interface PageBodyProps {
  children?: React.ReactNode;
  flexLayout?: boolean;
}

const PageBody: React.FC<PageBodyProps> = ({ children, flexLayout }) => (
  <div
    // eslint-disable-next-line @typescript-eslint/naming-convention
    className={classnames('co-m-pane__body', { 'co-m-page__body': flexLayout })}
    style={{ paddingBottom: 0 }}
  >
    {children}
  </div>
);

export default PageBody;
