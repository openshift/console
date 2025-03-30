import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import * as classNames from 'classnames';

const NavTitle: React.FC<NavTitleProps> = ({
  children,
  className,
  dataTestID,
  style,
  ...props
}) => {
  return (
    <PageSection
      data-test-id={dataTestID}
      className={classNames('co-m-nav-title', className)}
      style={style}
      hasBodyWrapper={false}
      {...props}
    >
      {children}
    </PageSection>
  );
};

export type NavTitleProps = {
  children: React.ReactNode;
  dataTestID?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default NavTitle;
