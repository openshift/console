import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Alert } from '@patternfly/react-core';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory';
import {
  k8sGet,
  k8sCreate,
  TemplateKind,
  TemplateInstanceKind,
  apiVersionForModel,
  SecretKind,
} from '@console/internal/module/k8s';
import { TemplateModel, TemplateInstanceModel, SecretModel } from '@console/internal/models';
import { DiskMetadata } from '@console/local-storage-operator-plugin/src/components/disks-list/types';
import { CEPH_STORAGE_NAMESPACE, OSD_REMOVAL_TEMPLATE, DASHBOARD_LINK } from '../../constants';
import {
  OCSColumnStateAction,
  ActionType,
  Status,
  ReplacedDisk,
  OCSColumnState,
} from '../disk-inventory/state-reducer';

const createTemplateSecret = async (template: TemplateKind, osdId: string) => {
  const parametersSecret: SecretKind = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      generateName: `${OSD_REMOVAL_TEMPLATE}-${osdId}-`,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
    stringData: {
      [template.parameters[0].name]: osdId,
    },
  };
  return k8sCreate(SecretModel, parametersSecret);
};

const createTemplateInstance = async (
  parametersSecret: SecretKind,
  template: TemplateKind,
  osd: string,
  nodeName: string,
  disk: DiskMetadata,
) => {
  const { path, deviceID, serial } = disk;
  const templateInstance: TemplateInstanceKind = {
    apiVersion: apiVersionForModel(TemplateInstanceModel),
    kind: TemplateInstanceModel.kind,
    metadata: {
      generateName: `${OSD_REMOVAL_TEMPLATE}-${osd}-`,
      namespace: CEPH_STORAGE_NAMESPACE,
      /* Adding annotations to uniquely identify a disk after replacement. */
      annotations: {
        devicePath: path,
        deviceOsd: osd,
        deviceNode: nodeName,
        deviceID,
        deviceSerial: serial,
      },
    },
    spec: {
      secret: {
        name: parametersSecret.metadata.name,
      },
      template,
    },
  };
  return k8sCreate(TemplateInstanceModel, templateInstance);
};

const instantiateTemplate = async (osdId: string, nodeName: string, disk: DiskMetadata) => {
  const osdRemovalTemplate = await k8sGet(
    TemplateModel,
    OSD_REMOVAL_TEMPLATE,
    CEPH_STORAGE_NAMESPACE,
  );
  const templateSecret = await createTemplateSecret(osdRemovalTemplate, osdId);
  await createTemplateInstance(templateSecret, osdRemovalTemplate, osdId, nodeName, disk);
};

const DiskReplacementAction = (props: DiskReplacementActionProps) => {
  const { t } = useTranslation();

  const { disk, nodeName, ocsState, dispatch, cancel, close } = props;

  const { path: diskName, deviceID: diskID, serial: diskSerial } = disk;
  const { alertsMap, replacingDiskList, replacedDiskList, isRebalancing } = ocsState;

  const [inProgress, setProgress] = React.useState(false);
  const [errorMessage, setError] = React.useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setProgress(true);
    try {
      let replacingDiskIndex = -1;
      const replacingDiskStatus = Status.PreparingToReplace;
      const { osd } = alertsMap?.[diskName] || { osd: '' };
      const replacedDisk = replacedDiskList?.find((rd: ReplacedDisk) => {
        const diskInfo = rd?.disk || { id: '', serial: '', path: '', node: '' };
        return (
          rd?.node === nodeName &&
          diskInfo.path === diskName &&
          diskInfo?.id === diskID &&
          diskInfo?.serial === diskSerial
        );
      });
      const { status: replacementStatus } = replacedDisk || {};

      if (replacingDiskList.length)
        replacingDiskIndex = replacingDiskList.findIndex(
          (rd) => rd?.id === diskID && rd?.serial === diskSerial && rd?.path === diskName,
        );

      if (replacingDiskIndex !== -1) {
        throw new Error(
          t(
            'ceph-storage-plugin~replacement disallowed: disk {{diskName}} is {{replacingDiskStatus}}',
            { diskName, replacingDiskStatus },
          ),
        );
      }

      if (
        replacementStatus === Status.PreparingToReplace ||
        replacementStatus === Status.ReplacementReady ||
        replacementStatus === Status.ReplacementFailed
      )
        throw new Error(
          t(
            'ceph-storage-plugin~replacement disallowed: disk {{diskName}} is {{replacementStatus}}',
            { diskName, replacementStatus },
          ),
        );
      else {
        instantiateTemplate(osd, nodeName, disk);
        dispatch({
          type: ActionType.SET_REPLACING_DISK_LIST,
          payload: [
            {
              id: diskID,
              serial: diskSerial,
              path: diskName,
            },
          ],
        });
      }
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} name="form" className="modal-content">
      <ModalTitle>{t('ceph-storage-plugin~Disk Replacement')}</ModalTitle>
      <ModalBody>
        <p>{t('ceph-storage-plugin~This action will start preparing the disk for replacement.')}</p>
        {isRebalancing && alertsMap?.[diskName]?.status !== Status.Offline && (
          <Alert
            variant="info"
            className="co-alert"
            title={t('ceph-storage-plugin~Data rebalancing is in progress')}
            isInline
          >
            <Link onClick={close} to={DASHBOARD_LINK}>
              {t('ceph-storage-plugin~See data resiliency status')}
            </Link>
          </Alert>
        )}
        <p>
          <Trans t={t} ns="ceph-storage-plugin">
            Are you sure you want to replace <strong>{{ diskName }}</strong>?
          </Trans>
        </p>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('ceph-storage-plugin~Replace')}
        cancel={cancel}
      />
    </form>
  );
};

export const diskReplacementModal = createModalLauncher(DiskReplacementAction);

export type DiskReplacementActionProps = {
  disk: DiskMetadata;
  nodeName: string;
  ocsState: OCSColumnState;
  dispatch: React.Dispatch<OCSColumnStateAction>;
} & ModalComponentProps;
