import { createContext } from 'react';
import { Model } from '@patternfly/react-topology';
import { observable, computed } from 'mobx';
import { WatchK8sResources } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  TopologyDataModelDepicted,
  TopologyDataModelGetter,
  TopologyDataModelReconciler,
  TopologyDataResources,
} from '../topology-types';
import { WORKLOAD_TYPES } from '../utils/topology-utils';
import {
  addToTopologyDataModel,
  getBaseWatchedResources,
  getWorkloadResources,
} from './transform-utils';

export type ModelExtensionContext = {
  priority: number;
  resources?: (namespace: string) => WatchK8sResources<any>;
  workloadKeys?: string[];
  dataModelGetter?: TopologyDataModelGetter;
  dataModelDepicter?: TopologyDataModelDepicted;
  dataModelReconciler?: TopologyDataModelReconciler;
};

export class ExtensibleModel {
  private extensions: { [id: string]: ModelExtensionContext } = {};

  @observable
  public namespace: string;

  @observable.ref
  public model: Model = { nodes: [], edges: [] };

  @observable
  public loaded: boolean = false;

  @observable
  public loadError: string;

  @observable
  public extensionsLoaded: boolean = false;

  @observable.ref
  public watchedResources: WatchK8sResources<any> = {};

  public onExtensionsLoaded: (extensibleModel: ExtensibleModel) => void;

  public constructor(namespace?: string) {
    this.namespace = namespace;
  }

  private updateExtensionsLoaded(): void {
    const extensionKeys = Object.keys(this.extensions);
    const prev = this.extensionsLoaded;
    this.extensionsLoaded =
      extensionKeys.length > 1 &&
      extensionKeys.every(
        (key) =>
          !!this.extensions[key].dataModelGetter &&
          !!this.extensions[key].dataModelDepicter &&
          !!this.extensions[key].dataModelReconciler,
      );
    if (!prev && this.extensionsLoaded && this.onExtensionsLoaded) {
      this.onExtensionsLoaded(this);
    }
  }

  public getExtensions(): { [id: string]: ModelExtensionContext } {
    return this.extensions;
  }

  public getExtension(id: string): ModelExtensionContext {
    return this.extensions[id];
  }

  public get workloadKeys(): string[] {
    const workloadKeys = [...WORKLOAD_TYPES];
    Object.keys(this.extensions).forEach((key) => {
      if (this.extensions[key].workloadKeys) {
        this.extensions[key].workloadKeys.forEach((workloadKey) => {
          if (!workloadKeys.includes(workloadKey)) {
            workloadKeys.push(workloadKey);
          }
        });
      }
    });
    return workloadKeys;
  }

  public updateWatchedResources = (): void => {
    const extensionKeys = Object.keys(this.extensions);
    this.watchedResources = extensionKeys.reduce((acc, key) => {
      if (this.extensions[key].resources) {
        const resList = this.extensions[key].resources(this.namespace);
        Object.keys(resList).forEach((resKey) => {
          if (!acc[resKey]) {
            acc[resKey] = resList[resKey];
          }
        });
      }
      return acc;
    }, getBaseWatchedResources(this.namespace));
  };

  public updateExtension = (id: string, extension: ModelExtensionContext): void => {
    this.extensions[id] = { ...(this.extensions[id] || {}), ...extension };
    this.updateExtensionsLoaded();
    this.updateWatchedResources();
  };

  public getWorkloadResources = (resources: TopologyDataResources): K8sResourceKind[] => {
    const resList = this.watchedResources;
    const kindsMap = Object.keys(resList).reduce((acc, key) => {
      acc[key] = resList[key].kind;
      return acc;
    }, {});
    return getWorkloadResources(resources, kindsMap, this.workloadKeys);
  };

  public get prioritizedKeys(): string[] {
    return Object.keys(this.extensions).sort(
      (k1, k2) => this.extensions[k1].priority - this.extensions[k2].priority,
    );
  }

  public get dataModelGetters(): TopologyDataModelGetter[] {
    return this.prioritizedKeys.reduce((acc, key) => {
      if (this.extensions[key].dataModelGetter) {
        acc.push(this.extensions[key].dataModelGetter);
      }
      return acc;
    }, []);
  }

  public get dataModelDepicters(): TopologyDataModelDepicted[] {
    return this.prioritizedKeys.reduce((acc, key) => {
      if (this.extensions[key].dataModelDepicter) {
        acc.push(this.extensions[key].dataModelDepicter);
      }
      return acc;
    }, []);
  }

  public get dataModelReconcilers(): TopologyDataModelReconciler[] {
    return this.prioritizedKeys.reduce((acc, key) => {
      if (this.extensions[key].dataModelReconciler) {
        acc.push(this.extensions[key].dataModelReconciler);
      }
      return acc;
    }, []);
  }

  @computed
  public get isEmptyModel(): boolean {
    return (this.model?.nodes?.length ?? 0) === 0;
  }

  public getExtensionModels = async (resources: TopologyDataResources): Promise<Model> => {
    const topologyModel: Model = {
      nodes: [],
      edges: [],
    };
    const getters = this.dataModelGetters;

    if (!getters?.length) {
      return Promise.resolve(topologyModel);
    }

    const depicters = this.dataModelDepicters;
    const workloadResources = this.getWorkloadResources(resources);
    const promises = getters.map((getter) => {
      try {
        return getter(this.namespace, resources, workloadResources);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Unable to add some resources to topology', e);
        return null;
      }
    });

    await Promise.all(promises).then((models) => {
      models.forEach((model) => {
        if (model) {
          try {
            addToTopologyDataModel(model, topologyModel, depicters);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Unable to add some resources to topology', e);
          }
        }
      });
    });

    return Promise.resolve(topologyModel);
  };

  public reconcileModel = (model: Model, resources: TopologyDataResources): void => {
    this.dataModelReconcilers.forEach((reconciler) => {
      try {
        reconciler(model, resources);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Unable to reconcile some resources in topology', e);
      }
    });
  };
}

export const ModelContext = createContext<ExtensibleModel>(null);
