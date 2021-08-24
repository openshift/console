import * as React from 'react';
import { ToolbarItem, Button, AlertVariant } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation, Trans } from 'react-i18next';
import { useAccessReview } from '@console/internal/components/utils';
import { dateTimeFormatter } from '@console/internal/components/utils/datetime';
import { k8sCreate, k8sGet, k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import {
  useFlag,
  useIsMobile,
  USERSETTINGS_PREFIX,
  useToast,
  useUserSettings,
} from '@console/shared/src';
import { ALLOW_EXPORT_APP, EXPORT_CR_NAME } from '../../const';
import { ExportModel } from '../../models';
import { getExportAppData } from '../../utils/export-app-utils';
import exportApplicationModal from './export-app-modal';
import { ExportAppUserSettings } from './types';

type ExportApplicationProps = {
  namespace: string;
  isDisabled: boolean;
};

const ExportApplication: React.FC<ExportApplicationProps> = ({ namespace, isDisabled }) => {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const isMobile = useIsMobile();
  const isExportAppAllowed = useFlag(ALLOW_EXPORT_APP);
  const canExportApp = useAccessReview({
    group: ExportModel.apiGroup,
    resource: ExportModel.plural,
    verb: 'create',
    namespace,
  });
  const toast = useToast();
  const [exportAppToast, setExportAppToast] = useUserSettings<ExportAppUserSettings>(
    `${USERSETTINGS_PREFIX}.exportApp`,
    {},
    true,
  );

  const createExportCR = async () => {
    try {
      const exportResp = await k8sCreate<K8sResourceKind>(ExportModel, getExportAppData(namespace));
      const key = `${namespace}-${exportResp.metadata.name}`;
      const exportAppToastConfig = {
        ...exportAppToast,
        [key]: {
          uid: exportResp.metadata.uid,
          name: exportResp.metadata.name,
          kind: exportResp.kind,
          namespace,
        },
      };
      toast.addToast({
        variant: AlertVariant.info,
        title: t('topology~Export Application'),
        content: (
          <Trans t={t} ns="topology">
            Export of resources in <strong>{{ namespace }}</strong> has started.
          </Trans>
        ),
        dismissible: true,
        timeout: true,
      });
      setExportAppToast(exportAppToastConfig);
      setIsCreating(false);
    } catch (error) {
      setIsCreating(false);
      toast.addToast({
        variant: AlertVariant.danger,
        title: t('topology~Export Application'),
        content: (
          <Trans t={t} ns="topology">
            Export of resources in <strong>{{ namespace }}</strong> has failed with error:{' '}
            {error.message}
          </Trans>
        ),
        dismissible: true,
        timeout: true,
      });
    }
  };

  const exportAppClickHandle = async () => {
    if (isCreating) {
      exportApplicationModal({ namespace });
      return;
    }
    try {
      setIsCreating(true);
      const exportRes = await k8sGet(ExportModel, EXPORT_CR_NAME, namespace);
      if (exportRes && exportRes.status?.completed !== true) {
        const startTime = dateTimeFormatter.format(new Date(exportRes.metadata.creationTimestamp));
        exportApplicationModal({ namespace, startTime });
        setIsCreating(false);
      } else if (exportRes && exportRes.status?.completed) {
        await k8sKill(ExportModel, exportRes);
        const exportAppToastConfig = _.omit(exportAppToast, `${namespace}-${EXPORT_CR_NAME}`);
        setExportAppToast(exportAppToastConfig);
        await createExportCR();
      }
    } catch {
      await createExportCR();
    }
  };

  const showExportAppBtn = canExportApp && isExportAppAllowed && !isMobile;

  return showExportAppBtn ? (
    <ToolbarItem>
      <Button
        variant="secondary"
        data-test="export-app-btn"
        aria-label={t('topology~Export Application')}
        isDisabled={isDisabled}
        onClick={exportAppClickHandle}
      >
        {t('topology~Export Application')}
      </Button>
    </ToolbarItem>
  ) : null;
};

export default ExportApplication;
