import { ObjectEnum } from '../../constants';
import { DeploymentStatus } from '../deployment';

export class PodDeploymentStatus extends ObjectEnum<string> {
  static readonly PROGRESSING = new PodDeploymentStatus(
    'PROGRESSING',
    DeploymentStatus.PROGRESSING,
  );

  static readonly ROLLOUT_COMPLETE = new PodDeploymentStatus(
    'ROLLOUT_COMPLETE',
    DeploymentStatus.ROLLOUT_COMPLETE,
  );

  static readonly FAILED = new PodDeploymentStatus('FAILED', DeploymentStatus.FAILED);

  static readonly POD_FAILED = new PodDeploymentStatus('POD_FAILED');

  static readonly UNKNOWN = new PodDeploymentStatus('UNKNOWN');

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<PodDeploymentStatus>(PodDeploymentStatus),
  );

  private static readonly stringMapper = PodDeploymentStatus.ALL.reduce(
    (accumulator, status: PodDeploymentStatus) => ({
      ...accumulator,
      [status.value]: status,
    }),
    {},
  );

  private static readonly deploymentStatusMapper = PodDeploymentStatus.ALL.reduce(
    (accumulator, status: PodDeploymentStatus) => {
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

  static getAll = () => PodDeploymentStatus.ALL;

  static fromString = (model: string): PodDeploymentStatus =>
    PodDeploymentStatus.stringMapper[model];

  static fromDeploymentStatus = (deploymentStatus: DeploymentStatus): PodDeploymentStatus =>
    PodDeploymentStatus.deploymentStatusMapper[deploymentStatus];

  private readonly deploymentStatus: DeploymentStatus;

  private constructor(value: string, deploymentStatus?: DeploymentStatus) {
    super(value);
    this.deploymentStatus = deploymentStatus;
  }
}
