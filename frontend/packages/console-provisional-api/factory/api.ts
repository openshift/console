import { PageHeadingProps, HorizontalNavProps } from './types';

const MockImpl = () => {
  throw new Error('Fix your webpack configuration');
};

export const PageHeading: React.FC<PageHeadingProps> = MockImpl;
export const HorizontalNav: React.FC<HorizontalNavProps> = MockImpl;
