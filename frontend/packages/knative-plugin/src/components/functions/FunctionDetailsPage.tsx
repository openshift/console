import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import { ServiceTypeValue } from '../../types';
import { ServiceDetailsPage } from '../services';
import { KnativeServiceTypeContext } from './ServiceTypeContext';

const FunctionDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const {
    params: { ns, name },
  } = props.match;
  return (
    <KnativeServiceTypeContext.Provider value={ServiceTypeValue.Functions}>
      <ServiceDetailsPage
        match={props.match}
        kind={referenceForModel(ServiceModel)}
        kindObj={ServiceModel}
        name={name}
        namespace={ns}
      />
    </KnativeServiceTypeContext.Provider>
  );
};

export default FunctionDetailsPage;
