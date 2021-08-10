import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';

const PageLoader: React.FC = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Bullseye>
        <Spinner />
      </Bullseye>
    </div>
  );
};

export default PageLoader;
