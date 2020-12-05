/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';
import { SelectDropdownObjectEnum } from '../select-dropdown-object-enum';

export class WorkloadProfile extends SelectDropdownObjectEnum<string> {
  static readonly DESKTOP = new WorkloadProfile('desktop', {
    // t('kubevirt-plugin~Desktop')
    labelKey: 'kubevirt-plugin~Desktop',
    // t('kubevirt-plugin~Small scale consumption, recommended for using the graphical console')
    descriptionKey:
      'kubevirt-plugin~Small scale consumption, recommended for using the graphical console',
    order: 1,
  });
  static readonly SERVER = new WorkloadProfile('server', {
    // t('kubevirt-plugin~Server')
    labelKey: 'kubevirt-plugin~Server',
    // t('kubevirt-plugin~Balances performance, compatible with a broad range of workloads')
    descriptionKey:
      'kubevirt-plugin~Balances performance, compatible with a broad range of workloads',
    order: 2,
  });
  static readonly HIGH_PERFORMANCE = new WorkloadProfile('highperformance', {
    // t('kubevirt-plugin~High-performance')
    labelKey: 'kubevirt-plugin~High-performance',
    // t('kubevirt-plugin~Optimized for High resource consumption workloads')
    descriptionKey: 'kubevirt-plugin~Optimized for High resource consumption workloads',
    order: 3,
  });

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<WorkloadProfile>(WorkloadProfile),
  );

  private static readonly stringMapper = WorkloadProfile.ALL.reduce(
    (accumulator, workloadProfile: WorkloadProfile) => ({
      ...accumulator,
      [workloadProfile.value]: workloadProfile,
    }),
    {},
  );

  static getAll = () => WorkloadProfile.ALL;

  static fromString = (source: string): WorkloadProfile => WorkloadProfile.stringMapper[source];
}
