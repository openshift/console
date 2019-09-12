import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { TechPreviewBadge } from '@console/shared';
import { RevisionModelAlpha, RevisionModelBeta } from '../../models';
import { RevisionListAlpha, RevisionListBeta } from './RevisionList';

export interface RevisionsPageProps {
  namespace: string;
}

export const RevisionsPageAlpha: React.FC<RevisionsPageProps> = ({ namespace }) => (
  <ListPage
    namespace={namespace}
    canCreate={false}
    kind={referenceForModel(RevisionModelAlpha)}
    ListComponent={RevisionListAlpha}
    badge={<TechPreviewBadge />}
  />
);

export const RevisionsPageBeta: React.FC<RevisionsPageProps> = ({ namespace }) => (
  <ListPage
    namespace={namespace}
    canCreate={false}
    kind={referenceForModel(RevisionModelBeta)}
    ListComponent={RevisionListBeta}
    badge={<TechPreviewBadge />}
  />
);
