/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '../object-enum';
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
  static readonly SAP_HANA = new WorkloadProfile('saphana', {
    // t('kubevirt-plugin~SAP HANA')
    labelKey: 'kubevirt-plugin~SAP HANA',
    // t('kubevirt-plugin~Optimized for SAP HANA workloads')
    descriptionKey: 'kubevirt-plugin~Optimized for SAP HANA workloads',
    order: 4,
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
