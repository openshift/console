/* eslint-disable */
import { UseK8sWatchResource, UseK8sWatchResources } from '../extensions/console-types';

export const useK8sWatchResource: UseK8sWatchResource = require('@console/internal/components/utils/k8s-watch-hook')
  .useK8sWatchResource;

export const useK8sWatchResources: UseK8sWatchResources = require('@console/internal/components/utils/k8s-watch-hook')
  .useK8sWatchResources;
