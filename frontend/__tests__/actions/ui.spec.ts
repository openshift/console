import * as _ from 'lodash-es';
import {
  ALL_NAMESPACES_KEY,
  LAST_PERSPECTIVE_LOCAL_STORAGE_KEY,
  PINNED_RESOURCES_LOCAL_STORAGE_KEY,
} from '@console/shared';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils/namespace';
import '../../__mocks__/localStorage';
import store from '../../public/redux';
import * as UIActions from '../../public/actions/ui';
import * as router from '../../public/components/utils/router';
import { getActiveNamespace } from '@console/internal/reducers/ui';

const setActiveNamespace = (ns) => store.dispatch(UIActions.setActiveNamespace(ns));
const setActivePerspective = (perspective) =>
  store.dispatch(UIActions.setActivePerspective(perspective));
const setPinnedResources = (resources) => store.dispatch(UIActions.setPinnedResources(resources));
const getNamespacedRoute = (path) =>
  UIActions.formatNamespaceRoute(getActiveNamespace(store.getState()), path);

describe('ui-actions', () => {
  describe('UIActions.formatNamespaceRoute', () => {
    it('formats namespaced routes', () => {
      [
        ['bar', '/k8s/ns/foo/pods', '/k8s/ns/bar/pods'],
        ['bar', '/search/ns/foo', '/search/ns/bar'],
        ['bar', '/status/ns/foo', '/status/ns/bar'],
        ['bar', '/k8s/all-namespaces/foo', '/k8s/ns/bar/foo'],
        ['bar', '/k8s/ns/foo/bar/baz', '/k8s/ns/bar/bar'],
      ].forEach((t) => {
        expect(UIActions.formatNamespaceRoute(t[0], t[1])).toEqual(t[2]);
      });
    });
  });

  describe('setActiveNamespace', () => {
    beforeEach(() => {
      Object.defineProperty(window.location, 'pathname', {
        writable: true,
        value: '*UNSET*',
      });
    });

    it('should set active namespace in memory', () => {
      setActiveNamespace('test1');
      expect(getActiveNamespace(store.getState())).toEqual('test1');
      setActiveNamespace('test2');
      expect(getActiveNamespace(store.getState())).toEqual('test2');
    });

    it('sets active namespace in memory to all-namespaces', () => {
      setActiveNamespace('test');
      setActiveNamespace(ALL_NAMESPACES_KEY);
      expect(_.isUndefined(getActiveNamespace(store.getState()))).toBe(false);
      expect(getActiveNamespace(store.getState())).toEqual(ALL_NAMESPACES_KEY);
    });

    it('should redirect namespaced location paths for known namespace-friendly prefixes', () => {
      window.location.pathname = '/k8s/ns/floorwax/pods';
      setActiveNamespace('dessert-topping');
      expect(
        formatNamespacedRouteForResource('pods', getActiveNamespace(store.getState())),
      ).toEqual('/k8s/ns/dessert-topping/pods');
    });

    it('should redirect namespaced location paths to their prefixes', () => {
      window.location.pathname = '/k8s/ns/floorwax/pods/new-shimmer';
      setActiveNamespace(ALL_NAMESPACES_KEY); // reset active namespace
      expect(
        formatNamespacedRouteForResource('pods', getActiveNamespace(store.getState())),
      ).toEqual('/k8s/all-namespaces/pods');
    });

    it('should redirect to all if no namespaces is selected', () => {
      window.location.pathname = '/k8s/ns/floorwax/pods';
      setActiveNamespace(ALL_NAMESPACES_KEY);
      expect(
        formatNamespacedRouteForResource('pods', getActiveNamespace(store.getState())),
      ).toEqual('/k8s/all-namespaces/pods');
    });

    it("should not redirect if the current path isn't namespaced, but should set active namespace in memory", () => {
      window.location.pathname = '/not-a-namespaced-path';
      setActiveNamespace('dessert-topping');
      expect(window.location.pathname).toEqual('/not-a-namespaced-path');
      expect(getActiveNamespace(store.getState())).toEqual('dessert-topping');
    });

    it('should redirect to list view if current path is "new" and setting to "all-namespaces"', () => {
      const spy = spyOn(router.history, 'pushPath');
      window.location.pathname = '/k8s/ns/floorwax/pods/~new';
      setActiveNamespace(ALL_NAMESPACES_KEY);
      expect(spy.calls.argsFor(0)[0]).toEqual('/k8s/all-namespaces/pods');
    });
  });

  describe('getNamespacedRoute', () => {
    it('formats a route correctly without an active namespace', () => {
      setActiveNamespace(ALL_NAMESPACES_KEY);
      expect(getNamespacedRoute('/k8s/ns/hello/pods')).toEqual('/k8s/all-namespaces/pods');
      expect(getNamespacedRoute('/k8s/ns/hello/pods/GRIBBL')).toEqual('/k8s/all-namespaces/pods');
    });

    it('formats a route with the current active namespace', () => {
      setActiveNamespace('test');
      expect(getNamespacedRoute('/k8s/ns/hello/pods')).toEqual('/k8s/ns/test/pods');
      expect(getNamespacedRoute('/k8s/ns/hello/pods/GRIBBL')).toEqual('/k8s/ns/test/pods');
    });

    it("preserves paths that aren't namespaced", () => {
      setActiveNamespace(ALL_NAMESPACES_KEY);
      expect(getNamespacedRoute('/')).toEqual('/');
      expect(getNamespacedRoute('/gribbl')).toEqual('/gribbl');
      expect(getNamespacedRoute('/pods')).toEqual('/pods');
    });

    it('parses resource from path', () => {
      setActiveNamespace(ALL_NAMESPACES_KEY);
      expect(getNamespacedRoute('/k8s/ns/foo/pods')).toEqual('/k8s/all-namespaces/pods');
      expect(getNamespacedRoute('/k8s/ns/foo/pods/WACKY_SUFFIX')).toEqual(
        '/k8s/all-namespaces/pods',
      );
    });
  });

  describe('setActivePerspective', () => {
    it('should create setActivePerspective action', () => {
      expect(UIActions.setActivePerspective('test')).toEqual({
        type: UIActions.ActionType.SetActivePerspective,
        payload: {
          perspective: 'test',
        },
        error: undefined,
        meta: undefined,
      });
    });

    it('sets active perspective in localStorage', () => {
      setActivePerspective('test');
      expect(localStorage.getItem(LAST_PERSPECTIVE_LOCAL_STORAGE_KEY)).toEqual('test');
    });
  });

  describe('setPinnedResources', () => {
    it('should create setPinnedResources action', () => {
      setActivePerspective('test');
      expect(UIActions.setPinnedResources(['resource1', 'resource2'])).toEqual({
        type: UIActions.ActionType.SetPinnedResources,
        payload: {
          resources: ['resource1', 'resource2'],
        },
        error: undefined,
        meta: undefined,
      });
    });

    it('sets pinned resources in localStorage', () => {
      setActivePerspective('testperspective');
      setPinnedResources(['resource1', 'resource2']);
      setActivePerspective('testperspective2');
      setPinnedResources(['resource3', 'resource4']);
      expect(JSON.parse(localStorage.getItem(PINNED_RESOURCES_LOCAL_STORAGE_KEY))).toEqual({
        testperspective: ['resource1', 'resource2'],
        testperspective2: ['resource3', 'resource4'],
      });
    });
  });
});
