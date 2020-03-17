import { Wrapper } from '../../wrapper';

export type TestData = {
  color?: string;
  interval?: {
    from?: number;
    to?: number;
  };
  location?: string;
};

export class TestWrapper extends Wrapper<TestData, TestWrapper> {}
