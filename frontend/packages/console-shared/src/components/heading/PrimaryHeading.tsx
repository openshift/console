import * as React from 'react';
import { Title } from '@patternfly/react-core';
import classNames from 'classnames';

const PrimaryHeading: React.FC<PrimaryHeadingProps> = ({
  children,
  className,
  alignItemsBaseline,
  centerText,
  ...props
}) => (
  <Title
    headingLevel="h1"
    className={classNames(
      'co-m-pane__heading',
      { 'co-m-pane__heading--baseline': alignItemsBaseline },
      { 'co-m-pane__heading--center': centerText },
      className,
    )}
    {...props}
  >
    {children}
  </Title>
);

export type PrimaryHeadingProps = {
  alignItemsBaseline?: boolean;
  centerText?: boolean;
  children: React.ReactNode;
  className?: string;
};

export default PrimaryHeading;
