import type { FC, ReactNode } from 'react';
import { Title } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';

const TertiaryHeading: FC<TertiaryHeadingProps> = ({
  altSpacing,
  children,
  className,
  ...props
}) => (
  <Title
    headingLevel="h3"
    className={css({ 'pf-v6-u-my-md': !altSpacing }, altSpacing, className)}
    {...props}
  >
    {children}
  </Title>
);

export type TertiaryHeadingProps = {
  children: ReactNode;
  className?: string;
  altSpacing?: string;
};

export default TertiaryHeading;
