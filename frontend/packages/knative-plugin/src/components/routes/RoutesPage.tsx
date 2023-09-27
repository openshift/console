import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { RouteModel } from '../../models';
import RouteList from './RouteList';

const RoutesPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { customData } = props;
  return (
    <ListPage
      {...props}
      canCreate={false}
      kind={referenceForModel(RouteModel)}
      ListComponent={RouteList}
      selector={
        customData?.selectResourcesForName
          ? { matchLabels: { 'serving.knative.dev/service': customData.selectResourcesForName } }
          : null
      }
    />
  );
};

export default RoutesPage;
