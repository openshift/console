import * as React from 'react';
import { Perspective, isPerspective } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk';

const useMaintainDefaultPerspective = (setActivePerspective: (perspectiveName: string) => void) => {
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);

  const defaultPerspective = perspectiveExtensions.find(
    (perspective) => perspective.properties.default,
  );
  React.useEffect(() => {
    if (defaultPerspective) {
      setActivePerspective(defaultPerspective.properties.id);
    }
  }, [defaultPerspective, setActivePerspective]);
};

export default useMaintainDefaultPerspective;
