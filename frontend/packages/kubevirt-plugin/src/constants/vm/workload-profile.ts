/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';
import { SelectDropdownObjectEnum } from '../select-dropdown-object-enum';
import {
  WORKLOAD_PROFILE_DESKTOP_DESC,
  WORKLOAD_PROFILE_SERVER_DESC,
  WORKLOAD_PROFILE_HIGH_PERFORMANCE_DESC,
} from '../../utils/strings';

export class WorkloadProfile extends SelectDropdownObjectEnum<string> {
  static readonly DESKTOP = new WorkloadProfile('desktop', {
    label: 'Desktop',
    description: WORKLOAD_PROFILE_DESKTOP_DESC,
    order: 1,
  });
  static readonly SERVER = new WorkloadProfile('server', {
    label: 'Server',
    description: WORKLOAD_PROFILE_SERVER_DESC,
    order: 2,
  });
  static readonly HIGH_PERFORMANCE = new WorkloadProfile('highperformance', {
    label: 'High-performance',
    description: WORKLOAD_PROFILE_HIGH_PERFORMANCE_DESC,
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
