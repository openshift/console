import * as React from 'react';
import { Button, AlertVariant, Flex, FlexItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation, Trans } from 'react-i18next';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import {
  ModalTitle,
  ModalBody,
  ModalComponentProps,
  ModalFooter,
  createModalLauncher,
} from '@console/internal/components/factory/modal';
import { dateTimeFormatter } from '@console/internal/components/utils/datetime';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  USERSETTINGS_PREFIX,
  useUserSettings,
  TOAST_TIMEOUT_DEFAULT,
  TOAST_TIMEOUT_LONG,
} from '@console/shared/src';
import { ToastContextType } from '@console/shared/src/components/toast/ToastContext';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import {
  createExportResource,
  getExportAppData,
  getExportResource,
  killExportResource,
} from '../../utils/export-app-utils';
import ExportViewLogButton from './ExportViewLogButton';
import { ExportAppUserSettings } from './types';

export type ExportApplicationModalProps = ModalComponentProps & {
  name: string;
  namespace: string;
  toast?: ToastContextType;
  exportResource?: K8sResourceKind;
};

export const ExportApplicationModal: React.FC<ExportApplicationModalProps> = (props) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const { cancel, name, namespace, exportResource, toast } = props;
  const [startTime, setStartTime] = React.useState<string>(null);
  const [errMessage, setErrMessage] = React.useState<string>('');
  const [exportAppToast, setExportAppToast] = useUserSettings<ExportAppUserSettings>(
    `${USERSETTINGS_PREFIX}.exportApp`,
    {},
    true,
  );

  React.useEffect(() => {
    if (exportResource && exportResource.status?.completed !== true) {
      setStartTime(dateTimeFormatter.format(new Date(exportResource.metadata.creationTimestamp)));
    }
  }, [exportResource]);

  const createExportCR = async () => {
    try {
      const exportRes = await createExportResource(getExportAppData(name, namespace));
      fireTelemetryEvent('Export Application Started');
      const key = `${namespace}-${name}`;
      const exportAppToastConfig = {
        ...exportAppToast,
        [key]: {
          groupVersionKind: getGroupVersionKindForResource(exportRes),
          uid: exportRes.metadata.uid,
          name,
          namespace,
        },
      };
      toast?.addToast({
        variant: AlertVariant.info,
        title: t('topology~Export application'),
        content: (
          <>
            <Trans t={t} ns="topology">
              Export of resources in <strong>{{ namespace }}</strong> has started.
            </Trans>
            <ExportViewLogButton name={name} namespace={namespace} />
          </>
        ),
        dismissible: true,
        timeout: TOAST_TIMEOUT_LONG,
      });
      setExportAppToast(exportAppToastConfig);
    } catch (error) {
      toast?.addToast({
        variant: AlertVariant.danger,
        title: t('topology~Export application'),
        content: (
          <Trans t={t} ns="topology">
            Export of resources in <strong>{{ namespace }}</strong> has failed with error:{' '}
            {error.message}
          </Trans>
        ),
        dismissible: true,
        timeout: TOAST_TIMEOUT_DEFAULT,
      });
    }
  };

  const killExportCR = async (): Promise<boolean> => {
    if (exportResource) {
      await killExportResource(exportResource);
    }
    return true;
  };

  const restartExportCR = async (): Promise<boolean> => {
    try {
      if (exportResource) {
        await killExportResource(exportResource);
      }
      const exportRes = await getExportResource(name, namespace);
      if (exportRes) {
        setTimeout(createExportCR, 2000);
      } else {
        await createExportCR();
      }
    } catch (err) {
      createExportCR().catch((createError) =>
        // eslint-disable-next-line no-console
        console.warn('Could not createExportCR:', createError),
      );
    }
    return true;
  };

  const handleStartExport = async () => {
    try {
      if (exportResource && exportResource.status?.completed) {
        await killExportResource(exportResource);
        const exportAppToastConfig = _.omit(exportAppToast, `${namespace}-${name}`);
        setExportAppToast(exportAppToastConfig);
        await createExportCR();
      } else {
        await createExportCR();
      }
    } catch (error) {
      createExportCR().catch((createError) =>
        // eslint-disable-next-line no-console
        console.warn('Could not createExportCR:', createError),
      );
    }
    cancel();
  };

  const handleCancel = async () => {
    try {
      await killExportCR();
      cancel();
    } catch (err) {
      setErrMessage(err.message);
    }
  };

  const handleRestart = async () => {
    try {
      await restartExportCR();
      cancel();
    } catch (err) {
      setErrMessage(err.message);
    }
  };
  const exportInProgress = exportResource && exportResource.status?.completed !== true;

  return (
    <div className="modal-content" data-test="export-application-modal">
      <ModalTitle>{t('topology~Export Application')}</ModalTitle>
      <ModalBody>
        {exportInProgress ? (
          startTime ? (
            <Trans t={t} ns="topology">
              Application export in <strong>{{ namespace }}</strong> is in progress. Started at{' '}
              {{ startTime }}.
            </Trans>
          ) : (
            <Trans t={t} ns="topology">
              Application export in <strong>{{ namespace }}</strong> is in progress.
            </Trans>
          )
        ) : (
          <Trans t={t} ns="topology">
            Do you want to export your application?
          </Trans>
        )}
      </ModalBody>
      <ModalFooter inProgress={false} errorMessage={errMessage}>
        <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
          <FlexItem>
            <Button
              type="button"
              variant="secondary"
              data-test={exportInProgress ? 'export-cancel-btn' : 'cancel-btn'}
              onClick={() => (exportInProgress ? handleCancel() : cancel())}
            >
              {exportInProgress ? t('topology~Cancel Export') : t('topology~Cancel')}
            </Button>
          </FlexItem>
          {exportInProgress && (
            <>
              <FlexItem>
                <Button
                  type="button"
                  variant="secondary"
                  data-test="export-restart-btn"
                  onClick={handleRestart}
                >
                  {t('topology~Restart Export')}
                </Button>
              </FlexItem>
              <FlexItem>
                <ExportViewLogButton name={name} namespace={namespace} onViewLog={cancel} />
              </FlexItem>
            </>
          )}
          <FlexItem>
            <Button
              type="button"
              variant="primary"
              data-test={
                exportResource && exportResource.status?.completed !== true
                  ? 'export-close-btn'
                  : 'close-btn'
              }
              onClick={() =>
                exportResource && exportResource.status?.completed !== true
                  ? cancel()
                  : handleStartExport()
              }
            >
              {t('topology~OK')}
            </Button>
          </FlexItem>
        </Flex>
      </ModalFooter>
    </div>
  );
};

export const exportApplicationModal = createModalLauncher<ExportApplicationModalProps>(
  ExportApplicationModal,
);

export const handleExportApplication = async (
  name: string,
  namespace: string,
  toast: ToastContextType,
) => {
  try {
    const exportRes = await getExportResource(name, namespace);
    exportApplicationModal({
      name,
      namespace,
      exportResource: exportRes,
      toast,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Error while getting export resource:', err);
    exportApplicationModal({
      name,
      namespace,
      toast,
    });
  }
};
