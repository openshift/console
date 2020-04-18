export const CONDITIONS_WARNING =
  'One or more health check remediation conditions have been met. The node will restart automatically.';

export const CPU_LIMIT_REQ_ERROR =
  'This node’s CPU resources are overcommitted. The total CPU resource limit of all pods exceeds the node’s total capacity. The total CPU requested is also approaching the node’s capacity. Pod performance will be throttled under high load, and new pods may not be schedulable on this node.';
export const CPU_LIMIT_ERROR =
  'This node’s CPU resources are overcommitted. The total CPU resource limit of all pods exceeds the node’s total capacity. Pod performance will be throttled under high load.';
export const CPU_LIMIT_WARN =
  'The total CPU resource limit of all pods on this node is approaching the node’s capacity. Pod performance may be throttled under high load.';
export const CPU_LIMIT_REQ_WARN =
  'The total CPU resource limit and amount requested by all pods on this node is approaching the node’s capacity. Pod performance may be throttled under high load, and new pods may not be schedulable.';
export const CPU_REQ_WARN =
  'The total CPU requested by all pods on this node is approaching the node’s capacity. New pods may not be schedulable on this node.';

export const MEM_LIMIT_REQ_ERROR =
  'This node’s memory resources are overcommitted. The total memory resource limit of all pods exceeds the node’s total capacity. The total memory requested is also approaching the node’s capacity. Pods will be terminated under high load, and new pods may not be schedulable on this node.';
export const MEM_LIMIT_ERROR =
  'This node’s memory resources are overcommitted. The total memory resource limit of all pods exceeds the node’s total capacity. Pods will be terminated under high load.';
export const MEM_LIMIT_WARN =
  'The total memory resource limit of all pods on this node is approaching the node’s capacity. Pods may be terminated if the limit is reached under high load.';
export const MEM_LIMIT_REQ_WARN =
  'The total memory resource limit and amount requested by all pods on this node is approaching the node’s capacity. Pods may be terminated if the limit is reached under high load, and new pods may not be schedulable on this node.';
export const MEM_REQ_WARN =
  'The total memory requested by all pods on this node is approaching the node’s capacity. New pods may not be schedulable on this node.';
