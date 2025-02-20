export enum RunStrategy {
  Always = 'Always',
  RerunOnFailure = 'RerunOnFailure',
  Halted = 'Halted',
  Manual = 'Manual',
}

export enum StateChangeRequest {
  Start = 'Start',
  Stop = 'Stop',
}
