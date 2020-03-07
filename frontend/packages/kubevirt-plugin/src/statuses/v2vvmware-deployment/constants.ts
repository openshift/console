import { ObjectEnum } from '../../constants';
import { DeploymentStatus } from '../deployment';

export class V2VVMWareDeploymentStatus extends ObjectEnum<string> {
  static readonly PROGRESSING = new V2VVMWareDeploymentStatus(
    'PROGRESSING',
    DeploymentStatus.PROGRESSING,
  );

  static readonly ROLLOUT_COMPLETE = new V2VVMWareDeploymentStatus(
    'ROLLOUT_COMPLETE',
    DeploymentStatus.ROLLOUT_COMPLETE,
  );

  static readonly FAILED = new V2VVMWareDeploymentStatus('FAILED', DeploymentStatus.FAILED);

  static readonly POD_FAILED = new V2VVMWareDeploymentStatus('POD_FAILED');

  static readonly UNKNOWN = new V2VVMWareDeploymentStatus('UNKNOWN');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<V2VVMWareDeploymentStatus>(V2VVMWareDeploymentStatus),
  );

  private static readonly stringMapper = V2VVMWareDeploymentStatus.ALL.reduce(
    (accumulator, status: V2VVMWareDeploymentStatus) => ({
      ...accumulator,
      [status.value]: status,
    }),
    {},
  );

  private static readonly deploymentStatusMapper = V2VVMWareDeploymentStatus.ALL.reduce(
    (accumulator, status: V2VVMWareDeploymentStatus) => {
      if (status.deploymentStatus) {
        return {
          ...accumulator,
          [status.deploymentStatus]: status,
        };
      }
      return accumulator;
    },
    {},
  );

  static getAll = () => V2VVMWareDeploymentStatus.ALL;

  static fromSerialized = (status: { value: string }): V2VVMWareDeploymentStatus =>
    V2VVMWareDeploymentStatus.fromString(status && status.value);

  static fromString = (model: string): V2VVMWareDeploymentStatus =>
    V2VVMWareDeploymentStatus.stringMapper[model];

  static fromDeploymentStatus = (deploymentStatus: DeploymentStatus): V2VVMWareDeploymentStatus =>
    V2VVMWareDeploymentStatus.deploymentStatusMapper[deploymentStatus];

  private readonly deploymentStatus: DeploymentStatus;

  private constructor(value: string, deploymentStatus?: DeploymentStatus) {
    super(value);
    this.deploymentStatus = deploymentStatus;
  }
}
