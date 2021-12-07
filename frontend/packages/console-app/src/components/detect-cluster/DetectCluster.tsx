import * as React from 'react';
import { ClusterContext, useValuesForClusterContext } from './cluster';

type DetectClusterProps = {
  children: React.ReactNode;
};

const DetectCluster: React.FC<DetectClusterProps> = ({ children }) => {
  const { cluster, setCluster, loaded } = useValuesForClusterContext();
  return loaded ? (
    <ClusterContext.Provider value={{ cluster, setCluster }}>{children}</ClusterContext.Provider>
  ) : null;
};

export default DetectCluster;
