import * as React from 'react';
import { WithActivePerspectiveHOC } from '../extensions';
import useActivePerspective from './useActivePerspective';

/**
 * RE: `props: any`.,, we needed to do this because TypeScript breaks down an `Omit` into a stand alone type which it
 * cannot infer is a subtype of the pre-Omit type. This makes the return statement throw an error as there might be a
 * confusion between the two types. `any` is a hack work around to get TS not to make that inference. For code sanity
 * the pre-Omit and post-Omit types are actually compatible and thus is not a real TS error due to the Omit props being
 * a standalone type.
 */
const withActivePerspective: WithActivePerspectiveHOC = (Component) => (props: any) => {
  const [activePerspective, setActivePerspective] = useActivePerspective();
  return (
    <Component
      {...props}
      activePerspective={activePerspective}
      setActivePerspective={setActivePerspective}
    />
  );
};

export default withActivePerspective;
