import type { ReactNode, CSSProperties } from 'react';
import { Title } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';

const SecondaryHeading: React.FCC<SecondaryHeadingProps> = ({ children, className, ...props }) => (
  <Title headingLevel="h2" className={css('co-section-heading', className)} {...props}>
    {children}
  </Title>
);

export type SecondaryHeadingProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
};

export default SecondaryHeading;
