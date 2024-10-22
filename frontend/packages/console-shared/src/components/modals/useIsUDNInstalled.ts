import { getReferenceForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { UserDefinedNetworkModel } from '@console/internal/models';
import { useK8sModel } from '../../hooks/useK8sModel';

const useIsUDNInstalled = () => {
  const [udnModel] = useK8sModel(getReferenceForModel(UserDefinedNetworkModel));

  return !!udnModel;
};

export default useIsUDNInstalled;
