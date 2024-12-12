import {
  t_temp_dev_tbd as globalPurple300 /* CODEMODS: you should update this color token, original v5 token was global_palette_purple_300 */,

  t_temp_dev_tbd as globalWhite /* CODEMODS: you should update this color token, original v5 token was global_palette_white */,
,
  t_temp_dev_tbd as globalWarning100 /* CODEMODS: you should update this color token, original v5 token was global_warning_color_100 */,
} from '@patternfly/react-tokens/dist/js/t_temp_dev_tbd';



export enum AllPodStatus {
  Running = 'Running',
  NotReady = 'Not Ready',
  Warning = 'Warning',
  Empty = 'Empty',
  Failed = 'Failed',
  Pending = 'Pending',
  Succeeded = 'Succeeded',
  Terminating = 'Terminating',
  Unknown = 'Unknown',
  ScaledTo0 = 'Scaled to 0',
  Idle = 'Idle',
  AutoScaledTo0 = 'Autoscaled to 0',
  ScalingUp = 'Scaling Up',
  CrashLoopBackOff = 'CrashLoopBackOff',
}

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
