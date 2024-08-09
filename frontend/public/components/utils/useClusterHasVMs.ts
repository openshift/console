import { useModelFinder } from '../../module/k8s';
import * as _ from 'lodash-es';

const useClusterHasVMs = () => {
  const { findModel } = useModelFinder();
  const virtualMachineModel = findModel('kubevirt.io', 'virtualmachines');

  return !_.isEmpty(virtualMachineModel);
};

export default useClusterHasVMs;
