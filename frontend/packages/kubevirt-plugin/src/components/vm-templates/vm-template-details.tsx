import * as React from 'react';
import {
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
  useAccessReview,
  asAccessReview,
} from '@console/internal/components/utils';
import { PersistentVolumeClaimKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { PersistentVolumeClaimModel, PodModel, TemplateModel } from '@console/internal/models';
import {
  useK8sWatchResource,
  NoModelError,
} from '@console/internal/components/utils/k8s-watch-hook';
import { DataVolumeModel } from '../../models';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import {
  VMTemplateResourceSummary,
  VMTemplateDetailsList,
  VMTemplateSchedulingList,
} from './vm-template-resource';
import { HashAnchor } from '../hash-anchor/hash-anchor';
import { useBaseImages } from '../../hooks/use-base-images';
import { isCommonTemplate } from '../../selectors/vm-template/basic';
import { getTemplateSourceStatus } from '../../statuses/template/template-source-status';

export const VMTemplateDetails: React.FC<VMTemplateDetailsProps> = ({ obj: template }) => {
  const [dataVolumes, dvLoaded, dvError] = useK8sWatchResource<V1alpha1DataVolume[]>({
    kind: DataVolumeModel.kind,
    isList: true,
    namespace: template.metadata.namespace,
  });
  const [pods, podsLoaded, podsError] = useK8sWatchResource<PodKind[]>({
    kind: PodModel.kind,
    isList: true,
    namespace: template.metadata.namespace,
  });
  const [pvcs, pvcsLoaded, pvcsError] = useK8sWatchResource<PersistentVolumeClaimKind[]>({
    kind: PersistentVolumeClaimModel.kind,
    isList: true,
    namespace: template.metadata.namespace,
  });
  const isCommon = isCommonTemplate(template);
  const [baseImages, imagesLoaded, error, baseImageDVs, baseImagePods] = useBaseImages(
    isCommon ? [template] : [],
    isCommon,
  );
  const sourceStatus = getTemplateSourceStatus({
    template,
    pvcs: [...baseImages, ...pvcs],
    dataVolumes: [...dataVolumes, ...baseImageDVs],
    pods: [...pods, ...baseImagePods],
  });
  const canUpdate = useAccessReview(asAccessReview(TemplateModel, template, 'patch'));
  const loaded = dvLoaded && imagesLoaded && podsLoaded && pvcsLoaded;

  return (
    <div className="co-m-pane__body">
      <StatusBox
        data={template}
        loadError={
          podsError || error || pvcsError || dvError instanceof NoModelError ? undefined : dvError
        }
        loaded={loaded}
      >
        <ScrollToTopOnMount />
        <div className="co-m-pane__body">
          <HashAnchor hash="details" />
          <SectionHeading text="VM Template Details" />
          <div className="row">
            <div className="col-sm-6">
              <VMTemplateResourceSummary template={template} canUpdateTemplate={canUpdate} />
            </div>
            <div className="col-sm-6">
              <VMTemplateDetailsList
                loaded
                template={template}
                sourceStatus={sourceStatus}
                canUpdateTemplate={canUpdate}
              />
            </div>
          </div>
        </div>
        <div id="scheduling" className="co-m-pane__body">
          <HashAnchor hash="scheduling" />
          <SectionHeading text="Scheduling and resources requirements" />
          <div className="row">
            <VMTemplateSchedulingList template={template} canUpdateTemplate={canUpdate} />
          </div>
        </div>
      </StatusBox>
    </div>
  );
};

type VMTemplateDetailsProps = {
  obj: TemplateKind;
};
