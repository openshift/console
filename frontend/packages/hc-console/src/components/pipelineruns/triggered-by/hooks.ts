import { merge } from 'lodash';
// FIXME react-redux types are 6.x while react-redux is 7.x
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { KebabAction } from '@console/internal/components/utils';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { StartedByLabel } from '../../pipelines/const';

type LabelMap = { [labelKey: string]: string };

const mergeLabelsWithResource = (labels: LabelMap, resource: K8sResourceCommon) => {
  return merge({}, resource, { metadata: { labels } });
};

export const useUserLabelForManualStart = (): LabelMap => {
  const user = useSelector((state) => state.UI.get('user'));

  return {
    // kube:admin is an invalid k8s label value
    [StartedByLabel.user]: user.metadata.name.replace(/:/, ''),
  };
};

export const usePipelineRunWithUserLabel = (plr: PipelineRun): PipelineRun => {
  const labels = useUserLabelForManualStart();

  return plr && mergeLabelsWithResource(labels, plr);
};

export const useMenuActionsWithUserLabel = (menuActions: KebabAction[]): KebabAction[] => {
  const labels = useUserLabelForManualStart();

  return menuActions.map((kebabAction) => {
    return (kind, resource, ...rest) =>
      kebabAction(kind, mergeLabelsWithResource(labels, resource), ...rest);
  });
};
