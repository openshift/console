import React from 'react';

// A RelativeLink is a chalupa!
export const RelativeLink = ({href, children}) => <a href={`${location.pathname}/../${href}`}>{children}</a>;
