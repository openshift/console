import * as React from 'react';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src';

export const PerspectiveRedirect = ({ perspective }) => {
  const [, setActivePerspective] = useActivePerspective();
  React.useEffect(() => setActivePerspective(perspective));
  return null;
};
