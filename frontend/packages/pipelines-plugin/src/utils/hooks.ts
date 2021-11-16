import { BadgeType, getBadgeFromType } from '@console/shared';
import {
  isGAVersionInstalled,
  isTriggersGAVersion,
  usePipelineOperatorVersion,
} from '../components/pipelines/utils/pipeline-operator';

const getOSPTechPreviewBadge = (installedGAVersion: boolean) =>
  installedGAVersion ? null : getBadgeFromType(BadgeType.TECH);

export const usePipelineTechPreviewBadge = (namespace: string) => {
  const operator = usePipelineOperatorVersion(namespace);
  if (!operator) return null;
  return getOSPTechPreviewBadge(isGAVersionInstalled(operator));
};

export const useTriggersTechPreviewBadge = (namespace: string) => {
  const operator = usePipelineOperatorVersion(namespace);
  if (!operator) return null;
  return getOSPTechPreviewBadge(isTriggersGAVersion(operator));
};
