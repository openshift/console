import * as React from 'react';
import { TemplateKind, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { K8sEntityMap, SuccessStatus } from '@console/shared/src';
import { ProvisionSource } from '../../constants/vm/provision-source';
import {
  TEMPLATE_VM_GOLDEN_OS_NAMESPACE,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
} from '../../constants/vm/constants';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { CDIUploadContext } from '../cdi-upload-provider/cdi-upload-provider';
import { getTemplateOperatingSystems } from '../../selectors/vm-template/advanced';
import { isPvcUploading } from '../../selectors/pvc/selectors';
import { UploadPVCPopover } from '../cdi-upload-provider/upload-pvc-popover';
import { uploadBaseImageModal } from '../modals/upload-base-image/upload-base-image';

const SourceAvailable: React.FC = () => <SuccessStatus title="Source available" />;

type UserTemplateSource = {
  template: TemplateKind;
  dataVolumeLookup: K8sEntityMap<V1alpha1DataVolume>;
};

const UserTemplateSource: React.FC<UserTemplateSource> = ({ template, dataVolumeLookup }) => {
  const { type, error } = ProvisionSource.getProvisionSourceDetails(template, {
    dataVolumeLookup,
  });

  if (type && !error) {
    return <SourceAvailable />;
  }

  return <>{error}</>;
};

type CommonTemplateSource = {
  template: TemplateKind;
  baseImageLookup: K8sEntityMap<PersistentVolumeClaimKind>;
};

const CommonTemplateSource: React.FC<CommonTemplateSource> = ({ template, baseImageLookup }) => {
  const { uploads, uploadData } = React.useContext(CDIUploadContext);
  const osName = getTemplateOperatingSystems([template])[0].id;
  const baseImage = baseImageLookup[osName];
  if (!baseImage) {
    const upload = uploads.find(
      (upl) => upl.pvcName === osName && upl.namespace === TEMPLATE_VM_GOLDEN_OS_NAMESPACE,
    );
    return (
      <>
        <Button
          variant={ButtonVariant.link}
          isInline
          onClick={() => uploadBaseImageModal({ uploadData, osName, upload })}
        >
          Add source
        </Button>
      </>
    );
  }
  if (isPvcUploading(baseImage)) {
    return <UploadPVCPopover pvc={baseImage} />;
  }
  return <SourceAvailable />;
};

export const TemplateSource: React.FC<TemplateSourceProps> = ({
  template,
  dataVolumeLookup,
  baseImageLookup,
}) => {
  if (template.metadata.labels?.[TEMPLATE_TYPE_LABEL] === TEMPLATE_TYPE_BASE) {
    return <CommonTemplateSource template={template} baseImageLookup={baseImageLookup} />;
  }
  return <UserTemplateSource template={template} dataVolumeLookup={dataVolumeLookup} />;
};

type TemplateSourceProps = {
  template: TemplateKind;
  dataVolumeLookup: K8sEntityMap<V1alpha1DataVolume>;
  baseImageLookup: K8sEntityMap<PersistentVolumeClaimKind>;
  detailed?: boolean;
};
