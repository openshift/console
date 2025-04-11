import * as React from 'react';
import { Title } from '@patternfly/react-core';
import classNames from 'classnames';

const TertiaryHeading: React.FC<TertiaryHeadingProps> = ({
  altSpacing,
  children,
  className,
  ...props
}) => (
  <Title
    headingLevel="h3"
    className={classNames({ 'pf-v6-u-my-md': !altSpacing }, altSpacing, className)}
    {...props}
  >
    {children}
  </Title>
);

export type TertiaryHeadingProps = {
  children: React.ReactNode;
  className?: string;
  altSpacing?: string;
};

export default TertiaryHeading;
