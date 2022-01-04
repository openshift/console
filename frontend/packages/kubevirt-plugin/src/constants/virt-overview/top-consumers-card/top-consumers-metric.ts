import { ObjectEnum } from '../../object-enum';

export type TopConsumerMetricData = {
  dropdownLabel: string;
  chartLabel: string;
};

export abstract class TopConsumerMetricObjectEnum<T> extends ObjectEnum<T> {
  protected readonly dropdownLabel: string;

  private readonly chartLabel: string;

  protected constructor(value: T, { dropdownLabel, chartLabel }: TopConsumerMetricData) {
    super(value);
    this.dropdownLabel = dropdownLabel;
    this.chartLabel = chartLabel;
  }

  getDropdownLabel = () => this.dropdownLabel;

  getChartLabel = () => this.chartLabel;
}
