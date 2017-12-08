/* global jest */
import * as _ from 'lodash';
import '../__mocks__/localStorage';

import store from '../public/redux';
import { UIActions, getActiveNamespace, getNamespacedRoute } from '../public/ui/ui-actions';

// Mock history's createHistory() using createMemoryHistory() so the tests can run outside the browser
jest.mock('history', () => {
  const original = require.requireActual('history');
  original.createHistory = jest.fn(original.createMemoryHistory);
  return original;
});

const setActiveNamespace = ns => store.dispatch(UIActions.setActiveNamespace(ns));

describe('ui-actions', () => {
  describe('setActiveNamespace', () => {
    beforeEach(() => {
      Object.defineProperty(window.location, 'pathname', {
        writable: true,
        value: '*UNSET*',
      });
    });

    it('should set active namespace in memory', () => {
      setActiveNamespace('test1');
      expect(getActiveNamespace()).toEqual('test1');
      setActiveNamespace('test2');
      expect(getActiveNamespace()).toEqual('test2');
    });

    it('clears active namespace in memory', () => {
      setActiveNamespace('test');
      setActiveNamespace(undefined);
      expect(_.isUndefined(getActiveNamespace())).toBe(true);
      expect(getActiveNamespace()).toEqual(undefined);
    });

    it('should redirect namespaced location paths for known namespace-friendly prefixes', () => {
      window.location.pathname = '/ns/floorwax/pods';
      setActiveNamespace('dessert-topping');
      expect(getNamespacedRoute('pods')).toEqual('/ns/dessert-topping/pods');
    });

    it('should redirect namespaced location paths to their prefixes', () => {
      window.location.pathname = '/ns/floorwax/pods/new-shimmer';
      setActiveNamespace(); // reset active namespace
      setActiveNamespace('dessert-topping');
      expect(getNamespacedRoute('pods')).toEqual('/ns/dessert-topping/pods');
    });

    it('should redirect to all if no namespaces is selected', () => {
      window.location.pathname = '/ns/floorwax/pods';
      setActiveNamespace(null);
      expect(getNamespacedRoute('pods')).toEqual('/all-namespaces/pods');
    });

    it('should not redirect if the current path isn\'t namespaced, but should set active namespace in memory', () => {
      window.location.pathname = '/not-a-namespaced-path';
      setActiveNamespace('dessert-topping');
      expect(window.location.pathname).toEqual('/not-a-namespaced-path');
      expect(getActiveNamespace()).toEqual('dessert-topping');
    });
  });

  describe('getNamespacedRoute', () => {
    it('formats a route correctly without an active namespace', () => {
      setActiveNamespace();
      expect(getNamespacedRoute('/pods')).toEqual('/all-namespaces/pods');
      expect(getNamespacedRoute('/pods/GRIBBL')).toEqual('/all-namespaces/pods/GRIBBL');
    });

    it('formats a route with the current active namespace', () => {
      setActiveNamespace('test');
      expect(getNamespacedRoute('/pods')).toEqual('/ns/test/pods');
      expect(getNamespacedRoute('/pods/GRIBBL')).toEqual('/ns/test/pods/GRIBBL');
    });

    it('parses resource from path', () => {
      setActiveNamespace();
      expect(getNamespacedRoute('/')).toEqual('/all-namespaces/');
      expect(getNamespacedRoute('/gribbl')).toEqual('/all-namespaces/gribbl');
      expect(getNamespacedRoute('gribbl')).toEqual('/all-namespaces/gribbl');
      expect(getNamespacedRoute('/pods')).toEqual('/all-namespaces/pods');
      expect(getNamespacedRoute('ns/foo/pods')).toEqual('/all-namespaces/pods');
      expect(getNamespacedRoute('ns/foo/pods/WACKY_SUFFIX')).toEqual('/all-namespaces/pods');
    });

    it('parses resources that contain a slash correctly', () => {
      setActiveNamespace();
      expect(getNamespacedRoute('//')).toEqual('/all-namespaces/');
      expect(getNamespacedRoute('/settings/users')).toEqual('/all-namespaces/settings/users');
      expect(getNamespacedRoute('ns/foo/pods/don\'t/lets/start')).toEqual('/all-namespaces/pods');
      expect(getNamespacedRoute('ns/foo/pods/bar//baz')).toEqual('/all-namespaces/pods');
      expect(getNamespacedRoute('all-namespaces/pods/terminal/')).toEqual('/all-namespaces/pods');
    });
  });
});
