import {
  t_global_icon_color_status_warning_default as globalWarning100,
  t_color_white as globalWhite,
  t_color_purple_30 as globalPurple300,
} from '@patternfly/react-tokens';
import { AllPodStatus } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export { AllPodStatus } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export const podColor = {
  [AllPodStatus.Running]: '#0066CC',
  [AllPodStatus.NotReady]: '#519DE9',
  [AllPodStatus.Warning]: globalWarning100.value,
  [AllPodStatus.Empty]: globalWhite.value,
  [AllPodStatus.Failed]: '#CC0000',
  [AllPodStatus.Pending]: '#8BC1F7',
  [AllPodStatus.Succeeded]: '#519149',
  [AllPodStatus.Terminating]: '#002F5D',
  [AllPodStatus.Unknown]: globalPurple300.value,
  [AllPodStatus.ScaledTo0]: globalWhite.value,
  [AllPodStatus.Idle]: globalWhite.value,
  [AllPodStatus.AutoScaledTo0]: globalWhite.value,
  [AllPodStatus.ScalingUp]: globalWhite.value,
  [AllPodStatus.CrashLoopBackOff]: '#CC0000',
};
