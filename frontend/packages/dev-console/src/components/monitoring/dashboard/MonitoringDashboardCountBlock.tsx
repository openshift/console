import * as React from 'react';
import { Bullseye } from '@patternfly/react-core';

const MonitoringDasboardCountBlock: React.FC = () => (
  <div className="graph-wrapper">
    <h5 className="graph-title">Pod Count</h5>
    <Bullseye>
      <h1>3</h1>
    </Bullseye>
  </div>
);

export default MonitoringDasboardCountBlock;
