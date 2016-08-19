import React from 'react';

// A Chalupa is a relative link
const Chalupa = ({href, children}) => <a href={`${location.pathname}/../${href}`}>{children}</a>;
export default Chalupa;
