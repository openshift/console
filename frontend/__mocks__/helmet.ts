/**
 * Mock helmet module
 */
jest.mock('react-helmet-async', () => ({
  Helmet: jest.fn(({ children }) => children),
  HelmetProvider: () => jest.fn(),
}));
