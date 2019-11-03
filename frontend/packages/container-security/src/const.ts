import {
  /* eslint-disable @typescript-eslint/camelcase */
  chart_color_red_400 as red400,
  chart_color_red_300 as red300,
  chart_color_red_100 as red100,
  chart_color_orange_300 as orange300,
  chart_color_gold_400 as gold400,
  chart_color_black_500 as black500,
  /* eslint-enable @typescript-eslint/camelcase */
} from '@patternfly/react-tokens';

export const SecurityLabellerFlag = 'SECURITY_LABELLER';

export const VulnPriority = {
  Defcon1: {
    color: red400,
    description:
      'Defcon1 is a Critical problem which has been manually highlighted by the Quay team. It requires immediate attention.',
    index: 0,
    level: 'error',
    score: 11,
    title: 'Defcon 1',
    value: 'Defcon1',
  },
  Critical: {
    color: red300,
    description:
      'Critical is a world-burning problem, exploitable for nearly all people in a installation of the package. Includes remote root privilege escalations, or massive data loss.',
    index: 1,
    level: 'error',
    score: 10,
    title: 'Critical',
    value: 'Critical',
  },
  High: {
    color: red100,
    description:
      'High is a real problem, exploitable for many people in a default installation. Includes serious remote denial of services, local root privilege escalations, or data loss.',
    index: 2,
    level: 'warning',
    score: 9,
    title: 'High',
    value: 'High',
  },
  Low: {
    color: orange300,
    description:
      'Low is a security problem, but is hard to exploit due to environment, requires a user-assisted attack, a small install base, or does very little damage.',
    index: 4,
    level: 'warning',
    score: 3,
    title: 'Low',
    value: 'Low',
  },
  Medium: {
    color: gold400,
    description:
      'Medium is a real security problem, and is exploitable for many people. Includes network daemon denial of service attacks, cross-site scripting, and gaining user privileges.',
    index: 3,
    level: 'warning',
    score: 6,
    title: 'Medium',
    value: 'Medium',
  },
  Negligible: {
    color: black500,
    description:
      'Negligible is technically a security problem, but is only theoretical in nature, requires a very special situation, has almost no install base, or does no real damage.',
    index: 5,
    level: 'info',
    score: 1,
    title: 'Negligible',
    value: 'Negligible',
  },
  Unknown: {
    color: black500,
    description:
      'Unknown is either a security problem that has not been assigned to a priority yet or a priority that our system did not recognize',
    index: 6,
    level: 'info',
    score: 0,
    title: 'Unknown',
    value: 'Unknown',
  },
};
