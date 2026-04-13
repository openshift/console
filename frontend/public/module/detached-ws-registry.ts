/**
 * Global registry for WebSocket instances transferred from PodConnect to
 * DetachedPodExec. Keyed by detached session ID.
 *
 * When a user clicks "Detach to Cloud Shell", PodConnect stores its
 * live WSFactory here so that DetachedPodExec can adopt it instead of
 * opening a second connection (which may fail on privileged debug pods).
 */

import type { DetachedSessionCleanup } from '@console/webterminal-plugin/src/redux/actions/cloud-shell-actions';
import { k8sKillByName } from './k8s';
import { NamespaceModel, PodModel } from '../models';

const registry = new Map<string, any>();

export function storeDetachedWebSocket(id: string, ws: any): void {
  registry.set(id, ws);
}

export function takeDetachedWebSocket(id: string): any | undefined {
  const ws = registry.get(id);
  if (ws) {
    registry.delete(id);
  }
  return ws;
}

export function hasDetachedWebSocket(id: string): boolean {
  return registry.has(id);
}

export async function cleanupDetachedResource(
  cleanup: DetachedSessionCleanup | undefined,
): Promise<void> {
  if (!cleanup) {
    return;
  }
  try {
    if (cleanup.type === 'namespace') {
      await k8sKillByName(NamespaceModel, cleanup.name);
    } else if (cleanup.type === 'pod' && cleanup.namespace) {
      await k8sKillByName(PodModel, cleanup.name, cleanup.namespace);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Could not clean up detached debug resource:', e);
  }
}
