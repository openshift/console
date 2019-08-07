import * as React from 'react';
import { match as RMatch } from 'react-router-dom';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { RevisionModel } from '../../models';
import RevisionList from './RevisionList';

export interface RevisionsPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const RevisionsPage: React.FC<RevisionsPageProps> = ({ match }) => (
  <ListPage
    namespace={match.params.ns}
    canCreate={false}
    kind={referenceForModel(RevisionModel)}
    ListComponent={RevisionList}
  />
);

export default RevisionsPage;
