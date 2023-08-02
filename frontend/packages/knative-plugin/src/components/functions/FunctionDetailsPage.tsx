import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { DetailsPage } from '@console/internal/components/factory';
import { history } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { ServiceModel } from '../../models';
import { ServiceTypeValue } from '../../types';
import { ServiceDetailsPage } from '../services';
import { KnativeServiceTypeContext } from './ServiceTypeContext';

const FunctionDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = () => {
  const params = useParams();
  const handleNamespaceChange = (newNamespace: string): void => {
    if (newNamespace === ALL_NAMESPACES_KEY) {
      history.push('/functions/all-namespaces');
    } else {
      history.push('/functions/ns/:ns');
    }
  };
  return (
    <KnativeServiceTypeContext.Provider value={ServiceTypeValue.Function}>
      <NamespacedPage
        variant={NamespacedPageVariants.light}
        hideApplications
        onNamespaceChange={handleNamespaceChange}
      >
        <ServiceDetailsPage
          kind={referenceForModel(ServiceModel)}
          kindObj={ServiceModel}
          name={params.name}
          namespace={params.ns}
        />
      </NamespacedPage>
    </KnativeServiceTypeContext.Provider>
  );
};

export default FunctionDetailsPage;
