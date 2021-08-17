import {
  UseK8sWatchResource,
  UseK8sWatchResources,
  UseResolvedExtensions,
  ConsoleFetch,
  ConsoleFetchJSON,
  ConsoleFetchText,
} from './api-types';
import { HorizontalNavProps } from './component-api-types';
import {
  CheckAccess,
  UseAccessReview,
  UseMultipleAccessReviews,
  AsAccessReview,
} from './internal/rbac';

export * from './api-types';
export * from './internal/rbac';

const newMockImpl = <T extends (...args: any) => any>(): T => {
  return ((() => {
    throw new Error(
      'You need to configure webpack externals to use this component or function at runtime.',
    );
  }) as unknown) as T;
};

const mockProperties = <T extends any, K extends keyof T>(obj: T, ...keys: K[]) => {
  keys.forEach((key) => {
    obj[key] = (newMockImpl() as unknown) as T[K];
  });
};

export const useK8sWatchResource: UseK8sWatchResource = newMockImpl();
export const useK8sWatchResources: UseK8sWatchResources = newMockImpl();
export const useResolvedExtensions: UseResolvedExtensions = newMockImpl();
export const consoleFetch: ConsoleFetch = newMockImpl();
export const consoleFetchJSON: ConsoleFetchJSON = newMockImpl();
mockProperties(consoleFetchJSON, 'delete', 'post', 'put', 'patch');
export const consoleFetchText: ConsoleFetchText = newMockImpl();
/**
 *
 * @type {import("./component-api-types").NavPage } NavPage
 *
 * A component that creates a Navigation bar. It takes array of NavPage objects and renderes a NavBar.
 * Routing is handled as part of the component.
 * @example
 * const HomePage: React.FC = (props) => {
 *     const page = {
 *       href: '/home',
 *       name: 'Home',
 *       component: () => <>Home</>
 *     }
 *     return <HorizontalNav match={props.match} pages={[page]} />
 * }
 *
 * @param {object=} resource - The resource associated with this Navigation, an object of K8sResourceCommon type
 * @param {NavPage[]} pages - An array of page objects
 * @param {object} match - match object provided by React Router
 */
export const HorizontalNav: React.FC<HorizontalNavProps> = newMockImpl();

// rbac
export const checkAccess: CheckAccess = newMockImpl();
export const useAccessReview: UseAccessReview = newMockImpl();
export const useMultipleAccessReviews: UseMultipleAccessReviews = newMockImpl();
export const asAccessReview: AsAccessReview = newMockImpl();
