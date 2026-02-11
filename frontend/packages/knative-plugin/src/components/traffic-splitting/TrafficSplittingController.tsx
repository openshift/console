import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ModalComponentProps, ModalWrapper } from '@console/internal/components/factory';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ConfigurationModel, RevisionModel } from '../../models';
import { getKnativeRevisionsData } from '../../topology/knative-topology-utils';
import TrafficSplitting from './TrafficSplitting';

type TrafficSplittingControllerProps = {
  obj: K8sResourceKind;
};

const TrafficSplittingController: FC<TrafficSplittingControllerProps> = (props) => {
  const {
    metadata: { namespace },
  } = props.obj;

  const watchResources = useMemo(
    () => ({
      revisions: {
        isList: true,
        kind: referenceForModel(RevisionModel),
        namespace,
        optional: true,
      },
      configurations: {
        isList: true,
        kind: referenceForModel(ConfigurationModel),
        namespace,
        optional: true,
      },
    }),
    [namespace],
  );

  const resources = useK8sWatchResources<{
    revisions: K8sResourceKind[];
    configurations: K8sResourceKind[];
  }>(watchResources);

  const loaded =
    Object.keys(resources).length > 0 &&
    Object.keys(resources).every((key) => resources[key].loaded);

  const revisions = getKnativeRevisionsData(props.obj, resources);

  return loaded ? <TrafficSplitting {...props} service={props.obj} revisions={revisions} /> : null;
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
  return useCallback(() => launcher<Props>(TrafficSplittingModalProvider, props), [
    launcher,
    props,
  ]);
};
