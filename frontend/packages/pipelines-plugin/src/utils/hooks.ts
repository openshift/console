import { BadgeType, getBadgeFromType } from '@console/shared';
import {
  isGAVersionInstalled,
  usePipelineOperatorVersion,
} from '../components/pipelines/utils/pipeline-operator';

export const usePipelineTechPreviewBadge = (namespace: string) => {
  const operator = usePipelineOperatorVersion(namespace);
  if (!operator) return null;
  const installedGA = isGAVersionInstalled(operator);
  return installedGA ? null : getBadgeFromType(BadgeType.TECH);
};
