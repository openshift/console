import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { ListPage } from '@console/internal/components/factory';
import { NetworkPoliciesList } from '@console/internal/components/network-policy';
import { multiNetworkPolicyRef } from './constants';

export type MultiNetworkPolicyPageNavProps = {
  namespace: string;
  kind: string;
};

export const MultiNetworkPolicyListPage: React.FC<MultiNetworkPolicyPageNavProps> = (props) => {
  const params = useParams();

  const namespace = React.useMemo(() => params.ns || 'default', [params.ns]);

  return (
    <ListPage
      ListComponent={NetworkPoliciesList}
      canCreate
      createProps={{
        to: `/k8s/ns/${namespace}/${multiNetworkPolicyRef}/~new/form`,
      }}
      {...props}
    />
  );
};
