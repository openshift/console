import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircleIcon, InProgressIcon } from '@patternfly/react-icons';
import { referenceForModel, TemplateKind } from '@console/internal/module/k8s';
import { Alert, Button, ButtonVariant, Label, Stack, StackItem } from '@patternfly/react-core';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { ExternalLink, LoadingInline, ResourceLink } from '@console/internal/components/utils';
import {
  SuccessStatus,
  ErrorStatus,
  WarningStatus,
  YellowExclamationTriangleIcon,
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
} from '@console/shared';
import { PersistentVolumeClaimModel, PodModel } from '@console/internal/models';

import { CDIUploadContext } from '../cdi-upload-provider/cdi-upload-provider';
import { addTemplateSourceModal } from '../modals/add-template-source/add-template-source';
import { DVImportStatus } from '../dv-status/dv-import-status';
import { createDeleteSourceModal } from '../modals/delete-source/delete-source';
import { isCommonTemplate } from '../../selectors/vm-template/basic';
import {
  isTemplateSourceError,
  SOURCE_TYPE,
  TemplateSourceStatus,
  TemplateSourceStatusBundle,
  TemplateSourceStatusError,
} from '../../statuses/template/types';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { BOOT_SOURCE_AVAILABLE, DataVolumeSourceType } from '../../constants';

import './vm-template-source.scss';

type SourceStatusErrorBodyProps = {
  sourceStatus: TemplateSourceStatusError;
};

export const SourceStatusErrorBody: React.FC<SourceStatusErrorBodyProps> = ({
  sourceStatus: { pod, error, alert },
}) => (
  <Stack hasGutter>
    <StackItem>{alert ? <Alert variant="danger" isInline title={error} /> : error}</StackItem>
    {pod && (
      <StackItem>
        <ResourceLink
          kind={PodModel.kind}
          name={pod.metadata.name}
          namespace={pod.metadata.namespace}
        />
      </StackItem>
    )}
  </Stack>
);

type AddSourceButtonProps = {
  template: TemplateKind;
};

const AddSourceButton: React.FC<AddSourceButtonProps> = ({ template }) => {
  const { t } = useTranslation();
  const uploadContextProps = React.useContext(CDIUploadContext);
  return (
    isCommonTemplate(template) && (
      <Button
        isInline
        variant={ButtonVariant.link}
        onClick={() => addTemplateSourceModal({ template, ...uploadContextProps })}
      >
        <PlusCircleIcon className="co-icon-and-text__icon" />
        {t('kubevirt-plugin~Add source')}
      </Button>
    )
  );
};

type DeleteSourceButtonProps = {
  template: TemplateKind;
  sourceStatus: TemplateSourceStatus;
};

const DeleteSourceButton: React.FC<DeleteSourceButtonProps> = ({ template, sourceStatus }) => {
  const { t } = useTranslation();
  return (
    isCommonTemplate(template) &&
    (sourceStatus.dataVolume || sourceStatus.pvc) && (
      <StackItem>
        <Button
          isInline
          variant={ButtonVariant.link}
          onClick={() => createDeleteSourceModal({ sourceStatus })}
        >
          {t('kubevirt-plugin~Delete source')}
        </Button>
      </StackItem>
    )
  );
};

type ContainerSourceProps = {
  container: string;
  isCDRom: boolean;
  clone?: boolean;
};

export const ContainerSource: React.FC<ContainerSourceProps> = ({ container, isCDRom, clone }) => {
  const { t } = useTranslation();
  let msg: string;
  if (clone) {
    msg = isCDRom
      ? t('kubevirt-plugin~Clone and boot from CD-ROM')
      : t('kubevirt-plugin~Clone and boot from disk');
  } else {
    msg = isCDRom ? t('kubevirt-plugin~Boot from CD-ROM') : t('kubevirt-plugin~Boot from disk');
  }
  return (
    <Stack>
      <StackItem className="text-secondary">{msg}</StackItem>
      <StackItem>{t('kubevirt-plugin~Container {{container}}', { container })}</StackItem>
    </Stack>
  );
};

type URLSourceProps = {
  url: string;
  isCDRom: boolean;
};

export const URLSource: React.FC<URLSourceProps> = ({ url, isCDRom }) => {
  const { t } = useTranslation();
  const msg = isCDRom ? t('kubevirt-plugin~Boot from CD-ROM') : t('kubevirt-plugin~Boot from disk');
  return (
    <Stack>
      <StackItem className="text-secondary">{msg}</StackItem>
      <StackItem>
        <ExternalLink href={url} text={url} additionalClassName="kv-template-source--url" />
      </StackItem>
    </Stack>
  );
};

type PVCSourceProps = {
  name: string;
  namespace: string;
  isCDRom: boolean;
  clone?: boolean;
};

export const PVCSource: React.FC<PVCSourceProps> = ({ name, namespace, isCDRom, clone }) => {
  const { t } = useTranslation();
  let msg: string;
  if (clone) {
    msg = isCDRom
      ? t('kubevirt-plugin~Clone and boot from CD-ROM')
      : t('kubevirt-plugin~Clone and boot from disk');
  } else {
    msg = isCDRom ? t('kubevirt-plugin~Boot from CD-ROM') : t('kubevirt-plugin~Boot from disk');
  }
  return (
    <Stack>
      <StackItem className="text-secondary">{msg}</StackItem>
      <StackItem>
        <ResourceLink kind={PersistentVolumeClaimModel.kind} name={name} namespace={namespace} />
      </StackItem>
    </Stack>
  );
};

type PXESourceProps = {
  pxe?: string;
  namespace?: string;
};

const PXESource: React.FC<PXESourceProps> = ({ pxe, namespace }) => {
  const { t } = useTranslation();
  return (
    <Stack>
      <StackItem className="text-secondary">
        {t('kubevirt-plugin~Boot from network (PXE)')}
      </StackItem>
      {pxe && (
        <StackItem>
          <ResourceLink
            kind={referenceForModel(NetworkAttachmentDefinitionModel)}
            name={pxe}
            namespace={namespace}
          />
        </StackItem>
      )}
    </Stack>
  );
};

type SourceDescriptionProps = {
  sourceStatus: TemplateSourceStatusBundle;
  template: TemplateKind;
};

export const SourceDescription: React.FC<SourceDescriptionProps> = ({ sourceStatus, template }) => {
  const { pvc, source, container, dvTemplate, pxe, isCDRom } = sourceStatus;
  switch (source) {
    case SOURCE_TYPE.BASE_IMAGE:
      return (
        <PVCSource
          name={pvc.metadata.name}
          namespace={pvc.metadata.namespace}
          isCDRom={isCDRom}
          clone
        />
      );
    case SOURCE_TYPE.PVC:
    case SOURCE_TYPE.DATA_VOLUME:
      return (
        <PVCSource name={pvc.metadata.name} namespace={pvc.metadata.namespace} isCDRom={isCDRom} />
      );
    case SOURCE_TYPE.PXE:
      return <PXESource pxe={pxe} namespace={template.metadata.namespace} />;
    case SOURCE_TYPE.CONTAINER:
      return <ContainerSource container={container} isCDRom={isCDRom} />;
    case SOURCE_TYPE.DATA_VOLUME_TEMPLATE: {
      const dvWrapper = new DataVolumeWrapper(dvTemplate);
      switch (dvWrapper.getType()) {
        case DataVolumeSourceType.HTTP:
        case DataVolumeSourceType.S3:
          return <URLSource url={dvWrapper.getURL()} isCDRom={isCDRom} />;
        case DataVolumeSourceType.REGISTRY:
          return <ContainerSource container={dvWrapper.getURL()} isCDRom={isCDRom} />;
        case DataVolumeSourceType.PVC:
          return (
            <PVCSource
              name={dvWrapper.getPersistentVolumeClaimName()}
              namespace={dvWrapper.getPersistentVolumeClaimNamespace()}
              isCDRom={isCDRom}
              clone
            />
          );
        default:
          return null;
      }
    }
    default:
      return null;
  }
};

export const TemplateSource: React.FC<TemplateSourceProps> = ({
  loadError,
  loaded,
  template,
  sourceStatus,
  detailed,
}) => {
  const { t } = useTranslation();
  if (loadError) {
    return <>{t('kubevirt-plugin~Error')}</>;
  }
  if (!loaded) {
    return <LoadingInline />;
  }

  if (!detailed) {
    if (isTemplateSourceError(sourceStatus)) {
      return (
        <Label variant="outline" color="red" icon={<RedExclamationCircleIcon />}>
          {t('kubevirt-plugin~Boot source error')}
        </Label>
      );
    }
    if (sourceStatus) {
      return sourceStatus.isReady ? (
        <Label variant="outline" color="green" icon={<GreenCheckCircleIcon />}>
          {
            // t('kubevirt-plugin~User defined boot source')
            // t('kubevirt-plugin~Community defined boot source')
          }
          {t('kubevirt-plugin~{{provider}} boot source', { provider: sourceStatus.provider })}
        </Label>
      ) : (
        <Label variant="outline" color="blue" icon={<InProgressIcon />}>
          {t('kubevirt-plugin~Preparing boot source')}
        </Label>
      );
    }
    return isCommonTemplate(template) ? (
      <Label variant="outline" color="orange" icon={<YellowExclamationTriangleIcon />}>
        {t('kubevirt-plugin~Boot source required')}
      </Label>
    ) : (
      <Label variant="outline" color="red" icon={<RedExclamationCircleIcon />}>
        {t('kubevirt-plugin~Boot source error')}
      </Label>
    );
  }

  if (!sourceStatus) {
    return <AddSourceButton template={template} />;
  }

  if (isTemplateSourceError(sourceStatus)) {
    return (
      <ErrorStatus title={t('kubevirt-plugin~Boot source error')}>
        <Stack hasGutter>
          <StackItem>
            <SourceStatusErrorBody sourceStatus={sourceStatus} />
          </StackItem>
          <DeleteSourceButton template={template} sourceStatus={sourceStatus} />
        </Stack>
      </ErrorStatus>
    );
  }

  const { isReady, dataVolume, pod, addedOn, provider } = sourceStatus;

  if (isReady) {
    // t('kubevirt-plugin~Available')
    // t('kubevirt-plugin~{{provider}} defined')
    return (
      <SuccessStatus
        popoverTitle={
          provider === BOOT_SOURCE_AVAILABLE
            ? t('kubevirt-plugin~Available')
            : t('kubevirt-plugin~{{provider}} defined', { provider })
        }
        title={provider === BOOT_SOURCE_AVAILABLE ? t('kubevirt-plugin~Available') : provider}
      >
        <Stack hasGutter>
          <StackItem className="text-secondary">
            {t(
              'kubevirt-plugin~This operating system boot source was added to the cluster by user on {{date}}',
              {
                date: new Date(addedOn).toLocaleDateString(),
              },
            )}
          </StackItem>
          <StackItem>
            <SourceDescription template={template} sourceStatus={sourceStatus} />
          </StackItem>
          <DeleteSourceButton template={template} sourceStatus={sourceStatus} />
        </Stack>
      </SuccessStatus>
    );
  }

  if (dataVolume) {
    return (
      <DVImportStatus dataVolume={dataVolume} pod={pod}>
        <DeleteSourceButton template={template} sourceStatus={sourceStatus} />
      </DVImportStatus>
    );
  }
  return <WarningStatus title={t('kubevirt-plugin~Unknown source')} />;
};

export type TemplateSourceProps = {
  loadError: boolean;
  loaded: boolean;
  template: TemplateKind;
  sourceStatus: TemplateSourceStatus;
  detailed?: boolean;
};
