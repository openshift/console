import * as React from 'react';
import { ToolbarItem, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useAccessReview } from '@console/internal/components/utils';
import { useFlag, useIsMobile, useToast } from '@console/shared/src';
import { ALLOW_EXPORT_APP, EXPORT_CR_NAME } from '../../const';
import { ExportModel } from '../../models';
import { handleExportApplication } from './ExportApplicationModal';

type ExportApplicationProps = {
  namespace: string;
  isDisabled: boolean;
};

const ExportApplication: React.FC<ExportApplicationProps> = ({ namespace, isDisabled }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const toast = useToast();
  const isExportAppAllowed = useFlag(ALLOW_EXPORT_APP);
  const canExportApp = useAccessReview({
    group: ExportModel.apiGroup,
    resource: ExportModel.plural,
    verb: 'create',
    namespace,
  });

  const showExportAppBtn = canExportApp && isExportAppAllowed && !isMobile;
  const name = EXPORT_CR_NAME;

  return showExportAppBtn ? (
    <ToolbarItem>
      <Button
        variant="secondary"
        data-test="export-app-btn"
        aria-label={t('topology~Export application')}
        isDisabled={isDisabled}
        onClick={() => handleExportApplication(name, namespace, toast)}
      >
        {t('topology~Export application')}
      </Button>
    </ToolbarItem>
  ) : null;
};

export default ExportApplication;
