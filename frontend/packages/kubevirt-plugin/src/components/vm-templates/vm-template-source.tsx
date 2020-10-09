import * as React from 'react';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { TemplateKind } from '@console/internal/module/k8s';
import { Button, ButtonVariant, Stack, StackItem } from '@patternfly/react-core';
import { CDIUploadContext } from '../cdi-upload-provider/cdi-upload-provider';
import { addTemplateSourceModal } from '../modals/add-template-source/add-template-source';
import { LoadingInline, ResourceLink } from '@console/internal/components/utils';
import { DVImportStatus } from '../dv-status/dv-import-status';
import { SuccessStatus, ErrorStatus, WarningStatus } from '@console/shared';
import { createDeleteSourceModal } from '../modals/delete-source/delete-source';
import { isCommonTemplate } from '../../selectors/vm-template/basic';
import {
  isTemplateSourceError,
  SOURCE_TYPE,
  TemplateSourceStatus,
  TemplateSourceStatusBundle,
} from '../../statuses/template/types';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { DataVolumeSourceType } from '../../constants';

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
  sourceStatus: TemplateSourceStatusBundle;
};

const DeleteSourceButton: React.FC<DeleteSourceButtonProps> = ({ template, sourceStatus }) =>
  isCommonTemplate(template) && (
    <Button
      isInline
      variant={ButtonVariant.link}
      onClick={() => createDeleteSourceModal({ sourceStatus })}
    >
      Delete source
    </Button>
  );

type SourceDescriptionProps = {
  sourceStatus: TemplateSourceStatusBundle;
};

const SourceDescription: React.FC<SourceDescriptionProps> = ({ sourceStatus }) => {
  const { pvc, dataVolume, source, container } = sourceStatus;
  switch (source) {
    case SOURCE_TYPE.BASE_IMAGE:
    case SOURCE_TYPE.PVC:
    case SOURCE_TYPE.DATA_VOLUME:
      return (
        <ResourceLink
          kind={PersistentVolumeClaimModel.kind}
          name={pvc.metadata.name}
          namespace={pvc.metadata.namespace}
        />
      );
    case SOURCE_TYPE.PXE:
      return <div>PXE (Network boot)</div>;
    case SOURCE_TYPE.CONTAINER:
      return <div>Container: {container}</div>;
    case SOURCE_TYPE.DATA_VOLUME_TEMPLATE: {
      const dvWrapper = new DataVolumeWrapper(dataVolume);
      switch (dvWrapper.getType()) {
        case DataVolumeSourceType.HTTP:
        case DataVolumeSourceType.S3:
          return (
            <div>
              URL: <a href={dvWrapper.getURL()}>image URL</a>
            </div>
          );
        case DataVolumeSourceType.REGISTRY:
          return <div>Container: {dvWrapper.getURL()}</div>;
        case DataVolumeSourceType.PVC:
          return (
            <ResourceLink
              kind={PersistentVolumeClaimModel.kind}
              name={dvWrapper.getPesistentVolumeClaimName()}
              namespace={dvWrapper.getPesistentVolumeClaimNamespace()}
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
  loaded,
  template,
  sourceStatus,
}) => {
  if (!loaded) {
    return <LoadingInline />;
  }
  if (!sourceStatus) {
    return <AddSourceButton template={template} />;
  }

  if (isTemplateSourceError(sourceStatus)) {
    return (
      <ErrorStatus title="Source error">
        <Stack hasGutter>
          <StackItem>{sourceStatus.error}</StackItem>
        </Stack>
      </ErrorStatus>
    );
  }

  const { isReady, dataVolume, pod } = sourceStatus;

  if (isReady) {
    return (
      <SuccessStatus title="Source available">
        <Stack hasGutter>
          <StackItem>
            <SourceDescription sourceStatus={sourceStatus} />
          </StackItem>
          <StackItem>
            <DeleteSourceButton template={template} sourceStatus={sourceStatus} />
          </StackItem>
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

type TemplateSourceProps = {
  loaded: boolean;
  template: TemplateKind;
  sourceStatus: TemplateSourceStatus;
  detailed?: boolean;
};
