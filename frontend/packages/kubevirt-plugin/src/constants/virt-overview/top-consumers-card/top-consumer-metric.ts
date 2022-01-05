import { ObjectEnum } from '../../object-enum';
import { TopConsumerMetricObjectEnum } from './top-consumers-metric';

export class TopConsumerMetric extends TopConsumerMetricObjectEnum<string> {
  static readonly CPU = new TopConsumerMetric('cpu', {
    // t('kubevirt-plugin~By CPU')
    dropdownLabel: 'kubevirt-plugin~By CPU',
    // t('kubevirt-plugin~CPU')
    chartLabel: 'kubevirt-plugin~CPU',
  });

  static readonly MEMORY = new TopConsumerMetric('memory', {
    // t('kubevirt-plugin~By memory')
    dropdownLabel: 'kubevirt-plugin~By memory',
    // t('kubevirt-plugin~Memory')
    chartLabel: 'kubevirt-plugin~Memory',
  });

  static readonly FILESYSTEM = new TopConsumerMetric('filesystem', {
    // t('kubevirt-plugin~By filesystem')
    dropdownLabel: 'kubevirt-plugin~By filesystem',
    // t('kubevirt-plugin~Used filesystem')
    chartLabel: 'kubevirt-plugin~Used filesystem',
  });

  static readonly MEMORY_SWAP = new TopConsumerMetric('memory-swap', {
    // t('kubevirt-plugin~By memory swap')
    dropdownLabel: 'kubevirt-plugin~By memory swap',
    // t('kubevirt-plugin~Memory swap')
    chartLabel: 'kubevirt-plugin~Memory swap',
  });

  static readonly VCPU_WAIT = new TopConsumerMetric('vcpu-wait', {
    // t('kubevirt-plugin~By vCPU wait')
    dropdownLabel: 'kubevirt-plugin~By vCPU wait',
    // t('kubevirt-plugin~vCPU wait')
    chartLabel: 'kubevirt-plugin~vCPU wait',
  });

  static readonly STORAGE_THROUGHPUT = new TopConsumerMetric('storage-throughput', {
    // t('kubevirt-plugin~By throughput')
    dropdownLabel: 'kubevirt-plugin~By throughput',
    // t('kubevirt-plugin~Storage throughput')
    chartLabel: 'kubevirt-plugin~Storage throughput',
  });

  static readonly STORAGE_IOPS = new TopConsumerMetric('storage-iops', {
    // t('kubevirt-plugin~By IOPS')
    dropdownLabel: 'kubevirt-plugin~By IOPS',
    // t('kubevirt-plugin~Storage IOPS')
    chartLabel: 'kubevirt-plugin~Storage IOPS',
  });

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<TopConsumerMetric>(TopConsumerMetric),
  );

  private static readonly stringMapper = TopConsumerMetric.ALL.reduce(
    (accumulator, metric: TopConsumerMetric) => ({
      ...accumulator,
      [metric.value]: metric,
    }),
    {},
  );

  private static readonly dropdownLabelMapper = TopConsumerMetric.ALL.reduce(
    (accumulator, metric: TopConsumerMetric) => ({
      ...accumulator,
      [metric.dropdownLabel.replace('kubevirt-plugin~', '')]: metric,
    }),
    {},
  );

  static getAll = () => TopConsumerMetric.ALL;

  static fromString = (source: string): TopConsumerMetric => TopConsumerMetric.stringMapper[source];

  static fromDropdownLabel = (dropdownLabel: string): TopConsumerMetric =>
    TopConsumerMetric.dropdownLabelMapper[dropdownLabel];
}
