import * as React from 'react';
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
import { DataVolumeSourceType } from '../../constants';

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
  const { uploads, uploadData } = React.useContext(CDIUploadContext);
  return (
    isCommonTemplate(template) && (
      <Button
        isInline
        variant={ButtonVariant.link}
        onClick={() => addTemplateSourceModal({ template, uploads, uploadData })}
      >
        <PlusCircleIcon className="co-icon-and-text__icon" />
        Add source
      </Button>
    )
  );
};

type DeleteSourceButtonProps = {
  template: TemplateKind;
  sourceStatus: TemplateSourceStatus;
};

const DeleteSourceButton: React.FC<DeleteSourceButtonProps> = ({ template, sourceStatus }) =>
  isCommonTemplate(template) &&
  (sourceStatus.dataVolume || sourceStatus.pvc) && (
    <StackItem>
      <Button
        isInline
        variant={ButtonVariant.link}
        onClick={() => createDeleteSourceModal({ sourceStatus })}
      >
        Delete source
      </Button>
    </StackItem>
  );

type ContainerSourceProps = {
  container: string;
  isCDRom: boolean;
};

export const ContainerSource: React.FC<ContainerSourceProps> = ({ container, isCDRom }) => (
  <Stack>
    <StackItem className="text-secondary">Boot from {isCDRom ? 'CD-ROM' : 'disk'}</StackItem>
    <StackItem>Container {container}</StackItem>
  </Stack>
);

type URLSourceProps = {
  url: string;
  isCDRom: boolean;
};

export const URLSource: React.FC<URLSourceProps> = ({ url, isCDRom }) => (
  <Stack>
    <StackItem className="text-secondary">Boot from {isCDRom ? 'CD-ROM' : 'disk'}</StackItem>
    <StackItem>
      <ExternalLink href={url} text={url} additionalClassName="kv-template-source--url" />
    </StackItem>
  </Stack>
);

type PVCSourceProps = {
  name: string;
  namespace: string;
  isCDRom: boolean;
};

export const PVCSource: React.FC<PVCSourceProps> = ({ name, namespace, isCDRom }) => (
  <Stack>
    <StackItem className="text-secondary">Boot from {isCDRom ? 'CD-ROM' : 'disk'}</StackItem>
    <StackItem>
      <ResourceLink kind={PersistentVolumeClaimModel.kind} name={name} namespace={namespace} />
    </StackItem>
  </Stack>
);

type PXESourceProps = {
  pxe?: string;
  namespace?: string;
};

const PXESource: React.FC<PXESourceProps> = ({ pxe, namespace }) => (
  <Stack>
    <StackItem className="text-secondary">Boot from network (PXE)</StackItem>
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

type SourceDescriptionProps = {
  sourceStatus: TemplateSourceStatusBundle;
  template: TemplateKind;
};

export const SourceDescription: React.FC<SourceDescriptionProps> = ({ sourceStatus, template }) => {
  const { pvc, source, container, dvTemplate, pxe, isCDRom } = sourceStatus;
  switch (source) {
    case SOURCE_TYPE.BASE_IMAGE:
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
              name={dvWrapper.getPesistentVolumeClaimName()}
              namespace={dvWrapper.getPesistentVolumeClaimNamespace()}
              isCDRom={isCDRom}
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
  if (loadError) {
    return <>Error</>;
  }
  if (!loaded) {
    return <LoadingInline />;
  }

  if (!detailed) {
    if (isTemplateSourceError(sourceStatus)) {
      return (
        <Label variant="outline" color="red" icon={<RedExclamationCircleIcon />}>
          Boot source error
        </Label>
      );
    }
    if (sourceStatus) {
      return sourceStatus.isReady ? (
        <Label variant="outline" color="green" icon={<GreenCheckCircleIcon />}>
          {sourceStatus.provider} boot source
        </Label>
      ) : (
        <Label variant="outline" color="blue" icon={<InProgressIcon />}>
          Preparing boot source
        </Label>
      );
    }
    return isCommonTemplate(template) ? (
      <Label variant="outline" color="orange" icon={<YellowExclamationTriangleIcon />}>
        Boot source required
      </Label>
    ) : (
      <Label variant="outline" color="red" icon={<RedExclamationCircleIcon />}>
        Boot source error
      </Label>
    );
  }

  if (!sourceStatus) {
    return <AddSourceButton template={template} />;
  }

  if (isTemplateSourceError(sourceStatus)) {
    return (
      <ErrorStatus title="Boot source error">
        <Stack hasGutter>
          <StackItem>
            <SourceStatusErrorBody sourceStatus={sourceStatus} />
          </StackItem>
          <DeleteSourceButton template={template} sourceStatus={sourceStatus} />
        </Stack>
      </ErrorStatus>
    );
  }

  const { isReady, dataVolume, pod } = sourceStatus;

  if (isReady) {
    return (
      <SuccessStatus title={sourceStatus.provider}>
        <Stack hasGutter>
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
  return <WarningStatus title="Unknown source" />;
};

export type TemplateSourceProps = {
  loadError: boolean;
  loaded: boolean;
  template: TemplateKind;
  sourceStatus: TemplateSourceStatus;
  detailed?: boolean;
};
