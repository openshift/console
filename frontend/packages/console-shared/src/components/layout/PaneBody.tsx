import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';

const PaneBody: React.FC<PaneBodyProps> = ({
  children,
  className,
  fullHeight,
  sectionHeading,
  style,
  ...props
}) => {
  return (
    <PageSection
      className={css(
        'co-m-pane__body',
        { 'co-m-pane__body--section-heading': sectionHeading },
        className,
      )}
      isFilled={fullHeight}
      hasBodyWrapper={false}
      style={style}
      {...props}
    >
      {children}
    </PageSection>
  );
};

export type PaneBodyProps = {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
  sectionHeading?: boolean;
  style?: React.CSSProperties;
};

export default PaneBody;
