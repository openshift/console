export type NodeCondition = {
  lastHeartbeatTime: string;
  lastTransitionTime: string;
  message: string;
  reason: string;
  status: string;
  type: string;
};

export type NodeAddress = {
  type: string;
  address: string;
};
