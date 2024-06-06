import { isEmpty } from 'lodash';
import { useLocation } from 'react-router-dom-v5-compat';
import { MultiNetworkPolicyModel } from '@console/internal/models';

const useIsMultiNetworkPolicy = () => {
  const location = useLocation();

  return (
    !isEmpty(location.pathname.match(MultiNetworkPolicyModel.kind)) ||
    !isEmpty(location.pathname.match(MultiNetworkPolicyModel.plural))
  );
};

export default useIsMultiNetworkPolicy;
