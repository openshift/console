import React from 'react';
import { Link } from 'react-router';

// A RelativeLink is a chalupa!
export const RelativeLink = ({to, children}) => <Link to={window.location.pathname.replace(/[^\/]*$/, to)}>{children}</Link>;
