import type { FC } from 'react';
import { useCallback } from 'react';
import { ToolbarItem, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useAccessReview } from '@console/internal/components/utils';
import { useToast } from '@console/shared/src';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { useIsMobile } from '@console/shared/src/hooks/useIsMobile';
import { ALLOW_EXPORT_APP, EXPORT_CR_NAME } from '../../const';
import { ExportModel } from '../../models';
import { handleExportApplication } from './ExportApplicationModal';

type ExportApplicationProps = {
  namespace: string;
  isDisabled: boolean;
};

const ExportApplication: FC<ExportApplicationProps> = ({ namespace, isDisabled }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const toast = useToast();
  const launchModal = useOverlay();
  const isExportAppAllowed = useFlag(ALLOW_EXPORT_APP);
  const canExportApp = useAccessReview({
    group: ExportModel.apiGroup,
    resource: ExportModel.plural,
    verb: 'create',
    namespace,
  });

  const showExportAppBtn = canExportApp && isExportAppAllowed && !isMobile;
  const name = EXPORT_CR_NAME;

  const handleClick = useCallback(async () => {
    await handleExportApplication(name, namespace, toast, launchModal);
  }, [launchModal, name, namespace, toast]);

  return showExportAppBtn ? (
    <ToolbarItem>
      <Button
        variant="secondary"
        data-test="export-app-btn"
        aria-label={t('topology~Export application')}
        isDisabled={isDisabled}
        onClick={handleClick}
      >
        {t('topology~Export application')}
      </Button>
    </ToolbarItem>
  ) : null;
};

export default ExportApplication;
