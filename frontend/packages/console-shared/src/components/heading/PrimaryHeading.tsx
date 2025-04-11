import * as React from 'react';
import { Title } from '@patternfly/react-core';
import classNames from 'classnames';

const PrimaryHeading: React.FC<PrimaryHeadingProps> = ({
  children,
  className,
  alignItemsBaseline,
  ...props
}) => (
  <Title
    headingLevel="h1"
    className={classNames(
      'co-m-pane__heading',
      { 'co-m-pane__heading--baseline': alignItemsBaseline },
      className,
    )}
    {...props}
  >
    {children}
  </Title>
);

export type PrimaryHeadingProps = {
  alignItemsBaseline?: boolean;
  children: React.ReactNode;
  className?: string;
};

export default PrimaryHeading;
