import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { TechPreviewBadge } from '@console/shared';
import { RouteModelAlpha, RouteModelBeta } from '../../models';
import { RouteListAlpha, RouteListBeta } from './RouteList';

export interface RoutesPageProps {
  namespace: string;
}

export const RoutesPageAlpha: React.FC<RoutesPageProps> = ({ namespace }) => (
  <ListPage
    namespace={namespace}
    canCreate={false}
    kind={referenceForModel(RouteModelAlpha)}
    ListComponent={RouteListAlpha}
    badge={<TechPreviewBadge />}
  />
);

export const RoutesPageBeta: React.FC<RoutesPageProps> = ({ namespace }) => (
  <ListPage
    namespace={namespace}
    canCreate={false}
    kind={referenceForModel(RouteModelBeta)}
    ListComponent={RouteListBeta}
    badge={<TechPreviewBadge />}
  />
);
