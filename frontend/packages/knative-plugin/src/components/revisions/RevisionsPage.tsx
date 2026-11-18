import type { ComponentProps, FC } from 'react';
import { ListPage } from '@console/internal/components/factory/list-page';
import { referenceForModel } from '@console/internal/module/k8s/k8s-ref';
import { RevisionModel } from '../../models';
import { RevisionList } from './RevisionList';

const RevisionsPage: FC<ComponentProps<typeof ListPage>> = (props) => {
  const { customData } = props;
  return (
    <ListPage
      {...props}
      canCreate={false}
      kind={referenceForModel(RevisionModel)}
      ListComponent={RevisionList}
      omitFilterToolbar
      selector={
        customData?.selectResourcesForName
          ? { matchLabels: { 'serving.knative.dev/service': customData.selectResourcesForName } }
          : null
      }
    />
  );
};

export default RevisionsPage;
