import * as React from 'react';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { ClusterTriggerBindingModel } from '../../models';
import { useTriggersTechPreviewBadge } from '../../utils/hooks';
import { useTriggersBreadcrumbsFor } from './hooks';

const ClusterTriggerBindingPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj } = props;
  const breadcrumbsFor = useTriggersBreadcrumbsFor(kindObj);
  const badge = useTriggersTechPreviewBadge(props.namespace);
  const commonActions = useCommonResourceActions(ClusterTriggerBindingModel, props.obj);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      menuActions={commonActions}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(DetailsForKind), navFactory.editYaml()]}
    />
  );
};

export default ClusterTriggerBindingPage;
