import * as React from 'react';
import { Title } from '@patternfly/react-core';
import classNames from 'classnames';

const SecondaryHeading: React.FC<SecondaryHeadingProps> = ({ children, className, ...props }) => (
  <Title headingLevel="h2" className={classNames('co-section-heading', className)} {...props}>
    {children}
  </Title>
);

export type SecondaryHeadingProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
};

export default SecondaryHeading;
