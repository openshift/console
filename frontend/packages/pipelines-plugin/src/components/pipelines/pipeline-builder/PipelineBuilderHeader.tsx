import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { BasePageHeading } from '@console/internal/components/utils/headings';
import { TechPreviewBadge } from '@console/shared';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';

const PipelineBuilderHeader: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation();
  const badge = usePipelineTechPreviewBadge(namespace);

  return (
    <BasePageHeading
      title={t('pipelines-plugin~Pipeline builder')}
      badge={badge && <TechPreviewBadge />}
      hideFavoriteButton
    />
  );
};

export default PipelineBuilderHeader;
