/* eslint-disable @typescript-eslint/camelcase */
import { chart_color_red_400 as red400 } from '@patternfly/react-tokens/dist/js/chart_color_red_400';
import { chart_color_red_300 as red300 } from '@patternfly/react-tokens/dist/js/chart_color_red_300';
import { chart_color_red_100 as red100 } from '@patternfly/react-tokens/dist/js/chart_color_red_100';
import { chart_color_orange_300 as orange300 } from '@patternfly/react-tokens/dist/js/chart_color_orange_300';
import { chart_color_gold_400 as gold400 } from '@patternfly/react-tokens/dist/js/chart_color_gold_400';
import { chart_color_black_500 as black500 } from '@patternfly/react-tokens/dist/js/chart_color_black_500';
/* eslint-enable @typescript-eslint/camelcase */
import { Map as ImmutableMap } from 'immutable';
import { ImageManifestVuln } from './types';

export const ContainerSecurityFlag = 'SECURITY_LABELLER';

export enum Priority {
  Defcon1 = 'Defcon1',
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Negligible = 'Negligible',
  Unknown = 'Unknown',
}

export const vulnPriority = ImmutableMap<Priority, VulnPriorityDescription>()
  .set(Priority.Defcon1, {
    color: red400,
    description:
      'Defcon1 is a Critical problem which has been manually highlighted by the Quay team. It requires immediate attention.',
    index: 0,
    level: 'error',
    score: 11,
    title: 'Defcon 1',
    value: 'Defcon1',
  })
  .set(Priority.Critical, {
    color: red300,
    description:
      'Critical is a world-burning problem, exploitable for nearly all people in a installation of the package. Includes remote root privilege escalations, or massive data loss.',
    index: 1,
    level: 'error',
    score: 10,
    title: 'Critical',
    value: 'Critical',
  })
  .set(Priority.High, {
    color: red100,
    description:
      'High is a real problem, exploitable for many people in a default installation. Includes serious remote denial of services, local root privilege escalations, or data loss.',
    index: 2,
    level: 'warning',
    score: 9,
    title: 'High',
    value: 'High',
  })
  .set(Priority.Medium, {
    color: orange300,
    description:
      'Medium is a real security problem, and is exploitable for many people. Includes network daemon denial of service attacks, cross-site scripting, and gaining user privileges.',
    index: 3,
    level: 'warning',
    score: 6,
    title: 'Medium',
    value: 'Medium',
  })
  .set(Priority.Low, {
    color: gold400,
    description:
      'Low is a security problem, but is hard to exploit due to environment, requires a user-assisted attack, a small install base, or does very little damage.',
    index: 4,
    level: 'warning',
    score: 3,
    title: 'Low',
    value: 'Low',
  })
  .set(Priority.Negligible, {
    color: black500,
    description:
      'Negligible is technically a security problem, but is only theoretical in nature, requires a very special situation, has almost no install base, or does no real damage.',
    index: 5,
    level: 'info',
    score: 1,
    title: 'Negligible',
    value: 'Negligible',
  })
  .set(Priority.Unknown, {
    color: black500,
    description:
      'Unknown is either a security problem that has not been assigned to a priority yet or a priority that our system did not recognize',
    index: 6,
    level: 'info',
    score: 0,
    title: 'Unknown',
    value: 'Unknown',
  });

export type VulnPriorityDescription = {
  color: any;
  description: string;
  index: number;
  level: 'error' | 'warning' | 'info';
  score: number;
  title: string;
  value: string;
};

export const totalFor = (priority: Priority) => (obj: ImageManifestVuln) => {
  switch (priority) {
    case Priority.Defcon1:
      return obj.status.defcon1Count || 0;
    case Priority.Critical:
      return obj.status.criticalCount || 0;
    case Priority.High:
      return obj.status.highCount || 0;
    case Priority.Medium:
      return obj.status.mediumCount || 0;
    case Priority.Low:
      return obj.status.lowCount || 0;
    case Priority.Negligible:
      return obj.status.negligibleCount || 0;
    case Priority.Unknown:
      return obj.status.unknownCount || 0;
    default:
      return 0;
  }
};

export const totalVulnFor = (priority: Priority) => (imageVulns): number => {
  if (!imageVulns) {
    return 0;
  }
  switch (priority) {
    case Priority.Defcon1:
      return imageVulns.filter((imageVuln) => imageVuln.severity === Priority.Defcon1).length;
    case Priority.Critical:
      return imageVulns.filter((imageVuln) => imageVuln.severity === Priority.Critical).length;
    case Priority.High:
      return imageVulns.filter((imageVuln) => imageVuln.severity === Priority.High).length;
    case Priority.Medium:
      return imageVulns.filter((imageVuln) => imageVuln.severity === Priority.Medium).length;
    case Priority.Low:
      return imageVulns.filter((imageVuln) => imageVuln.severity === Priority.Low).length;
    case Priority.Negligible:
      return imageVulns.filter((imageVuln) => imageVuln.severity === Priority.Negligible).length;
    case Priority.Unknown:
      return imageVulns.filter((imageVuln) => imageVuln.severity === Priority.Unknown).length;
    default:
      return 0;
  }
};

const vulnPriorityByTitle = vulnPriority.mapEntries(
  ([, vulnPriorityDescription]: [Priority, VulnPriorityDescription]) => [
    vulnPriorityDescription.title,
    vulnPriorityDescription,
  ],
) as ImmutableMap<string, VulnPriorityDescription>;

export const priorityFor = (severityTitle: string) =>
  vulnPriorityByTitle.get(severityTitle) || vulnPriority.get(Priority.Unknown);
