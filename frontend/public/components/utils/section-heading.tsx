import * as React from 'react';

export const SectionHeading: React.SFC<SectionHeadingProps> = ({text, children, style}) => <h2 className="co-section-heading" style={style}>{text}{children}</h2>;

/* eslint-disable no-undef */
export type SectionHeadingProps = {
  text: string;
  children?: any;
  style?: any;
};

/* eslint-enable no-undef */
SectionHeading.displayName = 'SectionHeading';
