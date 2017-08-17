import * as React from 'react';
import { Link } from 'react-router';

import { stripBasePath } from './index';

// A RelativeLink is a chalupa!
export const RelativeLink = ({to, children}) => {
  // Take the current path, remove the base path and change the final slug
  const path = stripBasePath(window.location.pathname).replace(/[^/]*$/, to);
  return <Link to={path}>{children}</Link>;
};
