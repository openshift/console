import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TechPreviewBadge } from '@console/shared';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';

const PipelineBuilderHeader: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation();
  const badge = usePipelineTechPreviewBadge(namespace);

  return (
    <PageHeading
      title={t('pipelines-plugin~Pipeline builder')}
      badge={badge && <TechPreviewBadge />}
      hideFavoriteButton
    />
  );
};

export default PipelineBuilderHeader;
