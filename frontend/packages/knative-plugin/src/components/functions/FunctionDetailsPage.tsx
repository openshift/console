import type { ComponentProps, FC } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import type { DetailsPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { ServiceModel } from '../../models';
import { ServiceTypeValue } from '../../types';
import ServiceDetailsPage from '../services/ServiceDetailsPage';
import { KnativeServiceTypeContext } from './ServiceTypeContext';

const FunctionDetailsPage: FC<ComponentProps<typeof DetailsPage>> = () => {
  const navigate = useNavigate();
  const params = useParams();
  const handleNamespaceChange = (newNamespace: string): void => {
    if (newNamespace === ALL_NAMESPACES_KEY) {
      navigate('/functions/all-namespaces');
    } else {
      navigate(generatePath('/functions/ns/:ns', { ns: newNamespace }));
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
