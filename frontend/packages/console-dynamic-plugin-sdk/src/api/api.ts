/* eslint-disable */
import {
  UseK8sWatchResource,
  UseK8sWatchResources,
  ConsoleFetch,
  ConsoleFetchJSON,
  ConsoleFetchText,
  HorizontalNavProps,
  UseResolvedExtensions,
} from '../extensions/console-types';

export const useK8sWatchResource: UseK8sWatchResource = require('@console/internal/components/utils/k8s-watch-hook')
  .useK8sWatchResource;
export const useK8sWatchResources: UseK8sWatchResources = require('@console/internal/components/utils/k8s-watch-hook')
  .useK8sWatchResources;
export const useResolvedExtensions: UseResolvedExtensions = require('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions')
  .useResolvedExtensions;
export const consoleFetch: ConsoleFetch = require('@console/dynamic-plugin-sdk/src/utils/fetch')
  .consoleFetch;
export const consoleFetchJSON: ConsoleFetchJSON = require('@console/dynamic-plugin-sdk/src/utils/fetch')
  .consoleFetchJSON;
export const consoleFetchText: ConsoleFetchText = require('@console/dynamic-plugin-sdk/src/utils/fetch')
  .consoleFetchText;
/**
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
export const HorizontalNav: React.FC<HorizontalNavProps> = require('@console/internal/components/utils/horizontal-nav')
  .HorizontalNavFacade;
