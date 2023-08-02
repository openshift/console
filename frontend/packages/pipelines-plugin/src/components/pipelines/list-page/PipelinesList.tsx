import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { Firehose } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
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
      <Helmet>
        <title>{t('pipelines-plugin~Pipelines')}</title>
      </Helmet>
      <div className="co-m-pane__body">
        <Firehose resources={resources}>
          <PipelineAugmentRunsWrapper namespace={namespace} />
        </Firehose>
      </div>
    </>
  );
};

export default PipelinesList;
