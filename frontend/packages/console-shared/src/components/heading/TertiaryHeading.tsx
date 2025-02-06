import * as React from 'react';
import { Title } from '@patternfly/react-core';
import * as classNames from 'classnames';

const TertiaryHeading: React.FC<TertiaryHeadingProps> = ({
  children,
  className,
  increasedMargins,
  ...props
}) => (
  <Title
    headingLevel="h3"
    className={classNames(increasedMargins ? 'pf-v6-u-my-xl' : 'pf-v6-u-my-md', className)}
    {...props}
  >
    {children}
  </Title>
);

export type TertiaryHeadingProps = {
  children: React.ReactNode;
  className?: string;
  increasedMargins?: boolean;
};

export default TertiaryHeading;
