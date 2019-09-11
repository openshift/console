import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { TechPreviewBadge } from '@console/shared';
import { RevisionModel } from '../../models';
import RevisionList from './RevisionList';

export interface RevisionsPageProps {
  namespace: string;
}

const RevisionsPage: React.FC<RevisionsPageProps> = ({ namespace }) => (
  <ListPage
    namespace={namespace}
    canCreate={false}
    kind={referenceForModel(RevisionModel)}
    ListComponent={RevisionList}
    badge={<TechPreviewBadge />}
  />
);

export default RevisionsPage;
