import { ObjectEnum } from './object-enum';

export type SelectDropdownData = {
  descriptionKey?: string;
  labelKey: string;
  order?: number;
};

export abstract class SelectDropdownObjectEnum<T> extends ObjectEnum<T> {
  private readonly labelKey: string;

  private readonly descriptionKey: string;

  private readonly order: number;

  protected constructor(value: T, { descriptionKey, labelKey, order }: SelectDropdownData) {
    super(value);
    this.labelKey = labelKey;
    this.descriptionKey = descriptionKey;
    this.order = order;
  }

  toString = () => this.labelKey;

  getDescriptionKey = () => this.descriptionKey;

  getOrder = () => this.order;
}
