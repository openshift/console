import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel, Selector } from '@console/internal/module/k8s';
import { RevisionModel } from '../../models';
import RevisionList from './RevisionList';

const RevisionsPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { customData } = props;
  return (
    <ListPage
      {...props}
      canCreate={false}
      kind={referenceForModel(RevisionModel)}
      ListComponent={RevisionList}
      selector={
        customData?.selectResourcesForName
          ? {
              matchLabels: {
                'serving.knative.dev/service': customData?.selectResourcesForName ?? '',
              },
            }
          : ({} as Selector)
      }
    />
  );
};

export default RevisionsPage;
