import * as React from 'react';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ModalComponentProps, ModalWrapper } from '@console/internal/components/factory';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getKnativeRevisionsData } from '../../topology/knative-topology-utils';
import { knativeServingResourcesTrafficSplitting } from '../../utils/traffic-splitting-utils';
import TrafficSplitting from './TrafficSplitting';

type ControllerProps = {
  loaded?: boolean;
  obj: K8sResourceKind;
  resources?: {
    configurations: FirehoseResult;
    revisions: FirehoseResult;
  };
};

const Controller: React.FC<ControllerProps> = (props) => {
  const { loaded, obj, resources } = props;
  const revisions = getKnativeRevisionsData(obj, resources);
  return loaded ? <TrafficSplitting {...props} service={obj} revisions={revisions} /> : null;
};

type TrafficSplittingControllerProps = {
  obj: K8sResourceKind;
};

const TrafficSplittingController: React.FC<TrafficSplittingControllerProps> = (props) => {
  const {
    metadata: { namespace },
  } = props.obj;
  const resources = knativeServingResourcesTrafficSplitting(namespace);

  return (
    <Firehose resources={resources}>
      <Controller {...props} />
    </Firehose>
  );
};

type Props = TrafficSplittingControllerProps & ModalComponentProps;

const TrafficSplittingModalProvider: OverlayComponent<Props> = (props) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <TrafficSplittingController
        cancel={props.closeOverlay}
        close={props.closeOverlay}
        {...props}
      />
    </ModalWrapper>
  );
};

export const useTrafficSplittingModalLauncher = (props: Props) => {
  const launcher = useOverlay();
  return React.useCallback(() => launcher<Props>(TrafficSplittingModalProvider, props), [
    launcher,
    props,
  ]);
};
