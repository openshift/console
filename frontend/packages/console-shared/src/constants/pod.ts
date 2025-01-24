import { global_palette_purple_300 as globalPurple300 } from '@patternfly/react-tokens/dist/js/global_palette_purple_300';
import { global_palette_white as globalWhite } from '@patternfly/react-tokens/dist/js/global_palette_white';
import { global_warning_color_100 as globalWarning100 } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
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
