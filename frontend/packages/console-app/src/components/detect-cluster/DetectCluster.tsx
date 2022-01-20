import * as React from 'react';
import { ClusterContext, useValuesForClusterContext } from './cluster';

type DetectClusterProps = {
  children: React.ReactNode;
};

const DetectCluster: React.FC<DetectClusterProps> = ({ children }) => {
  const { cluster, setCluster } = useValuesForClusterContext();
  return (
    <ClusterContext.Provider value={{ cluster, setCluster }}>{children}</ClusterContext.Provider>
  );
};

export default DetectCluster;
