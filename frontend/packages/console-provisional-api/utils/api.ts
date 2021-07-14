import { UseResolvedExtensions } from './types';

const MockImpl = () => {
  throw new Error('Webpack is not configured properly.');
};

export const useResolvedExtensions: UseResolvedExtensions = MockImpl;
