import { ObjectEnum } from '@console/shared/src/constants/object-enum';

export type SelectDropdownData = {
  description?: string;
  label?: string;
  order?: number;
};

export abstract class SelectDropdownObjectEnum<T> extends ObjectEnum<T> {
  private readonly label: string;

  private readonly description: string;

  private readonly order: number;

  protected constructor(value: T, { description, label, order }: SelectDropdownData = {}) {
    super(value);
    this.label = label;
    this.description = description;
    this.order = order;
  }

  toString = () => this.label || super.toString();

  getDescription = () => this.description;

  getOrder = () => this.order;
}
