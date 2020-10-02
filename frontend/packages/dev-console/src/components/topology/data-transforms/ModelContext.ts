import { createContext } from 'react';
import { observable, computed } from 'mobx';
import { Model } from '@patternfly/react-topology';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import {
  TopologyDataModelDepicted,
  TopologyDataModelGetter,
  TopologyDataModelReconciler,
  TopologyDataResources,
} from '../topology-types';
import {
  addToTopologyDataModel,
  getBaseWatchedResources,
  getWorkloadResources,
} from './transform-utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { WORKLOAD_TYPES } from '../topology-utils';

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

  private namespaceP: string;

  @observable.ref
  private modelP: Model = { nodes: [], edges: [] };

  @observable
  private loadedP: boolean = false;

  @observable
  private loadErrorP: string;

  public dataResources: TopologyDataResources = {};

  @observable
  public extensionsLoaded: boolean = false;

  @observable.ref
  public watchedResources: WatchK8sResources<any> = {};

  public onExtensionsLoaded: (extensibleModel: ExtensibleModel) => void;

  public constructor(namespace?: string) {
    this.namespace = namespace;
  }

  public get namespace(): string {
    return this.namespaceP;
  }

  public set namespace(namespace: string) {
    this.namespaceP = namespace;
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

  public set model(model: Model) {
    this.modelP = model;
  }

  public get model(): Model {
    return this.modelP;
  }

  public set loaded(loaded: boolean) {
    this.loadedP = loaded;
  }

  public get loaded(): boolean {
    return this.loadedP;
  }

  public set loadError(loadError: string) {
    this.loadErrorP = loadError;
  }

  public get loadeError(): string {
    return this.loadErrorP;
  }

  @computed
  public get isEmptyModel(): boolean {
    return (this.modelP?.nodes?.length ?? 0) === 0;
  }

  public getExtensionModels = async (resources: TopologyDataResources): Promise<Model> => {
    const getters = this.dataModelGetters;
    const depicters = this.dataModelDepicters;
    const workloadResources = this.getWorkloadResources(resources);
    const promises = getters?.length
      ? getters.map((getter) => getter(this.namespace, resources, workloadResources))
      : [Promise.resolve(null)];

    const topologyModel: Model = {
      nodes: [],
      edges: [],
    };

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

const ModelContext = createContext<ExtensibleModel>(null);

export default ModelContext;
