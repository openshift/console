import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Firehose } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { PipelineModel } from '../../../models';
import { filters } from './PipelineAugmentRuns';
import PipelineAugmentRunsWrapper from './PipelineAugmentRunsWrapper';

const PipelinesList: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const resources = [
    {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: PipelineModel.id,
      filters: { ...filters(t) },
    },
  ];
  return (
    <>
      <DocumentTitle>{t('pipelines-plugin~Pipelines')}</DocumentTitle>
      <PaneBody>
        <Firehose resources={resources}>
          <PipelineAugmentRunsWrapper namespace={namespace} />
        </Firehose>
      </PaneBody>
    </>
  );
};

export default PipelinesList;
