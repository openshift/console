import * as React from 'react';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { useTriggersTechPreviewBadge } from '../../utils/hooks';
import { useTriggersBreadcrumbsFor } from './hooks';

const ClusterTriggerBindingPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match, kind } = props;
  const breadcrumbsFor = useTriggersBreadcrumbsFor(kindObj, match);
  const badge = useTriggersTechPreviewBadge(props.namespace);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      menuActions={Kebab.factory.common}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(DetailsForKind(kind)), navFactory.editYaml()]}
    />
  );
};

export default ClusterTriggerBindingPage;
