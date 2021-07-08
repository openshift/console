import * as React from 'react';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
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

export const trafficModalLauncher = createModalLauncher<Props>(TrafficSplittingController);

export default TrafficSplittingController;
