import * as _ from 'lodash';
import { K8sResourceKind, LabelSelector } from '@console/internal/module/k8s';
import { getRouteWebURL } from '@console/internal/components/routes';
import { KNATIVE_SERVING_LABEL } from '@console/knative-plugin';
import { sortBuilds } from '@console/internal/components/overview';
import { ResourceProps, TransformPodData } from '@console/shared';
import { TopologyDataModel, TopologyDataResources } from './topology-types';

const isKnativeDeployment = (dc: ResourceProps): boolean => {
  return !!(dc.metadata && dc.metadata.labels && dc.metadata.labels[KNATIVE_SERVING_LABEL]);
};

export class TransformTopologyData {
  private topologyData: TopologyDataModel = {
    graph: { nodes: [], edges: [], groups: [] },
    topology: {},
  };

  private selectorsByService;

  private allServices;

  private transformPodData;

  constructor(public resources: TopologyDataResources, public application?: string) {
    if (this.resources.ksservices && this.resources.ksservices.data) {
      this.allServices = _.keyBy(
        [...this.resources.services.data, ...this.resources.ksservices.data],
        'metadata.name',
      );
    } else {
      this.allServices = _.keyBy(this.resources.services.data, 'metadata.name');
    }
    this.selectorsByService = this.getSelectorsByService();
    this.transformPodData = new TransformPodData(this.resources);
  }

  /**
   * get the topology data
   */
  public getTopologyData() {
    return this.topologyData;
  }

  /**
   * get the route data
   */
  getRouteData(ksroute) {
    return !_.isEmpty(ksroute.status) ? ksroute.status.url : null;
  }

  /**
   * Tranforms the k8s resources objects into topology data
   * @param targetDeployment
   */
  public transformDataBy(targetDeployment = 'deployments'): TransformTopologyData {
    if (!this.transformPodData.deploymentKindMap[targetDeployment]) {
      throw new Error(`Invalid target deployment resource: (${targetDeployment})`);
    }
    if (_.isEmpty(this.resources[targetDeployment].data)) {
      return this;
    }
    const targetDeploymentsKind = this.transformPodData.deploymentKindMap[targetDeployment].dcKind;

    // filter data based on the active application
    const resourceData = this.filterBasedOnActiveApplication(this.resources[targetDeployment].data);

    _.forEach(resourceData, (deploymentConfig) => {
      deploymentConfig.kind = targetDeploymentsKind;
      const dcUID = _.get(deploymentConfig, 'metadata.uid');

      const replicationControllers = this.transformPodData.getReplicationControllers(
        deploymentConfig,
        targetDeployment,
      );
      const current = _.head(replicationControllers);
      const previous = _.nth(replicationControllers, 1);
      const currentPods = current
        ? this.transformPodData.transformPods(
            this.transformPodData.getPods(current, deploymentConfig),
          )
        : [];
      const previousPods = previous
        ? this.transformPodData.transformPods(
            this.transformPodData.getPods(previous, deploymentConfig),
          )
        : [];
      const service = this.getService(deploymentConfig);
      const route = this.getRoute(service);
      const buildConfigs = this.getBuildConfigs(deploymentConfig);
      const { builds } = buildConfigs;
      // list of Knative resources
      const ksroute = this.getKSRoute(deploymentConfig);
      const configurations = this.getConfigurations(deploymentConfig);
      const revisions = this.getRevisions(deploymentConfig);
      // list of resources in the
      const nodeResources = [
        deploymentConfig,
        current,
        service,
        route,
        buildConfigs,
        ksroute,
        configurations,
        revisions,
      ];
      // populate the graph Data
      this.createGraphData(deploymentConfig);
      // add the lookup object
      const deploymentsLabels = _.get(deploymentConfig, 'metadata.labels') || {};
      const deploymentsAnnotations = _.get(deploymentConfig, 'metadata.annotations') || {};
      this.topologyData.topology[dcUID] = {
        id: dcUID,
        name:
          _.get(deploymentConfig, 'metadata.name') ||
          deploymentsLabels['app.kubernetes.io/instance'],

        type: 'workload',
        resources: _.map(nodeResources, (resource) => {
          return {
            ...resource,
            name: _.get(resource, 'metadata.name'),
          };
        }),
        pods: [...currentPods, ...previousPods],
        data: {
          url: !_.isEmpty(route.spec) ? getRouteWebURL(route) : this.getRouteData(ksroute),
          kind: targetDeploymentsKind,
          editUrl:
            deploymentsAnnotations['app.openshift.io/edit-url'] ||
            deploymentsAnnotations['app.openshift.io/vcs-uri'],
          builderImage: deploymentsLabels['app.kubernetes.io/name'],
          isKnativeResource: this.transformPodData.isKnativeServing(
            deploymentConfig,
            'metadata.labels',
          ),
          donutStatus: {
            pods: currentPods,
            build: builds && builds[0],
          },
        },
      };
    });
    return this;
  }

  private getSelectorsByService() {
    let allServices = _.keyBy(this.resources.services.data, 'metadata.name');
    if (this.resources.ksservices && this.resources.ksservices.data) {
      allServices = _.keyBy(
        [...this.resources.services.data, ...this.resources.ksservices.data],
        'metadata.name',
      );
    }
    const selectorsByService = _.mapValues(allServices, (service) => {
      return new LabelSelector(service.spec.selector);
    });
    return selectorsByService;
  }

  /**
   * filter data based on the active application
   * @param data
   */
  private filterBasedOnActiveApplication(data) {
    const PART_OF = 'app.kubernetes.io/part-of';
    if (!this.application) {
      return data;
    }
    return data.filter((dc) => {
      return _.get(dc, ['metadata', 'labels', PART_OF]) === this.application;
    });
  }

  /**
   * get the route information from the service
   * @param service
   */
  private getRoute(service: ResourceProps): ResourceProps {
    // get the route
    const route = {
      kind: 'Route',
      metadata: {},
      status: {},
      spec: {},
    };
    _.forEach(this.resources.routes.data, (routeConfig) => {
      if (_.get(service, 'metadata.name') === _.get(routeConfig, 'spec.to.name')) {
        _.merge(route, routeConfig);
      }
    });
    return route;
  }

  /**
   * get the knative route information from the service
   * @param service
   */
  private getKSRoute(dc: ResourceProps): ResourceProps {
    const route = {
      kind: 'Route',
      metadata: {},
      status: {},
      spec: {},
    };
    const { ksroutes } = this.resources;
    if (isKnativeDeployment(dc)) {
      _.forEach(ksroutes && ksroutes.data, (routeConfig) => {
        if (dc.metadata.labels[KNATIVE_SERVING_LABEL] === _.get(routeConfig, 'metadata.name')) {
          _.merge(route, routeConfig);
        }
      });
    }
    return route;
  }

  /**
   * get the configuration information from the service
   * @param replicationController
   */
  private getConfigurations(dc: ResourceProps): ResourceProps {
    const configuration = {
      kind: 'Configuration',
      metadata: {},
      status: {},
      spec: {},
    };
    const { configurations } = this.resources;
    if (isKnativeDeployment(dc)) {
      _.forEach(configurations && configurations.data, (config) => {
        if (dc.metadata.labels[KNATIVE_SERVING_LABEL] === _.get(config, 'metadata.name')) {
          _.merge(configuration, config);
        }
      });
    }
    return configuration;
  }

  /**
   * get the revision information from the service
   * @param replicationController
   */
  private getRevisions(dc: ResourceProps): ResourceProps {
    const revision = {
      kind: 'Revision',
      metadata: {},
      status: {},
      spec: {},
    };
    const { revisions } = this.resources;
    if (isKnativeDeployment(dc)) {
      _.forEach(revisions && revisions.data, (revisionConfig) => {
        if (dc.metadata.ownerReferences[0].uid === revisionConfig.metadata.uid) {
          _.merge(revision, revisionConfig);
        }
      });
    }
    return revision;
  }

  private getBuildConfigs(
    deploymentConfig: ResourceProps,
  ): ResourceProps & { builds: K8sResourceKind[] } {
    const buildConfig = {
      kind: 'BuildConfig',
      builds: [] as K8sResourceKind[],
      metadata: {},
      status: {},
      spec: {},
    };

    const bconfig = _.find(this.resources.buildconfigs.data, [
      'metadata.labels["app.kubernetes.io/instance"]',
      _.get(deploymentConfig, 'metadata.labels["app.kubernetes.io/instance"]'),
    ]);
    if (bconfig) {
      const bc = _.merge(buildConfig, bconfig);
      const builds = sortBuilds(this.getBuilds(bc));
      return { ...bc, builds };
    }
    return buildConfig;
  }

  private getBuilds({ metadata: { uid } }: ResourceProps): ResourceProps[] {
    const builds = {
      kind: 'Builds',
      metadata: {},
      status: {},
      spec: {},
    };
    const bs = this.resources.builds.data.filter(({ metadata: { ownerReferences } }) => {
      return _.some(ownerReferences, {
        uid,
        controller: true,
      });
    });
    return bs ? _.map(bs, (build) => _.extend({}, build, { kind: 'Builds' })) : [builds];
  }

  /**
   * fetches the service from the deploymentconfig
   * @param deploymentConfig
   */
  private getService(deploymentConfig: ResourceProps): ResourceProps {
    const service = {
      kind: 'Service',
      metadata: {},
      status: {},
      spec: {},
    };
    const configTemplate = _.get(deploymentConfig, 'spec.template');
    _.each(this.selectorsByService, (selector, serviceName) => {
      if (selector.matches(configTemplate)) {
        _.merge(service, this.allServices[serviceName]);
      }
    });
    return service;
  }

  /**
   * create graph data from the deploymentconfig.
   * @param deploymentConfig
   */
  private createGraphData(deploymentConfig) {
    // Current Node data
    const { metadata } = deploymentConfig;
    const currentNode = {
      id: metadata.uid,
      type: 'workload',
      name: (metadata.labels && metadata.labels['app.openshift.io/instance']) || metadata.name,
    };

    if (!_.some(this.topologyData.graph.nodes, { id: currentNode.id })) {
      // add the node to graph
      this.topologyData.graph.nodes.push(currentNode);
      const labels = _.get(deploymentConfig, 'metadata.labels');
      const annotations = _.get(deploymentConfig, 'metadata.annotations');
      let edges = [];
      const totalDeployments = _.cloneDeep(
        _.concat(this.resources.deploymentConfigs.data, this.resources.deployments.data),
      );
      // find and add the edges for a node
      if (_.has(annotations, ['app.openshift.io/connects-to'])) {
        try {
          edges = JSON.parse(annotations['app.openshift.io/connects-to']);
        } catch (e) {
          // connects-to annotation should hold a JSON string value but failed to parse
          // treat value as a comma separated list of strings
          edges = annotations['app.openshift.io/connects-to'].split(',').map((v) => v.trim());
        }
        _.map(edges, (edge) => {
          // handles multiple edges
          const targetNode = _.get(
            _.find(totalDeployments, ['metadata.labels["app.kubernetes.io/instance"]', edge]),
            'metadata.uid',
          );
          if (targetNode) {
            this.topologyData.graph.edges.push({
              id: `${currentNode.id}_${targetNode}`,
              type: 'connects-to',
              source: currentNode.id,
              target: targetNode,
            });
          }
        });
      }

      _.forEach(labels, (label, key) => {
        if (key !== 'app.kubernetes.io/part-of') {
          return;
        }
        // find and add the groups
        const groupExists = _.some(this.topologyData.graph.groups, {
          name: label,
        });
        if (!groupExists) {
          this.topologyData.graph.groups.push({
            id: `group:${label}`,
            name: label,
            nodes: [currentNode.id],
          });
        } else {
          const gIndex = _.findIndex(this.topologyData.graph.groups, { name: label });
          this.topologyData.graph.groups[gIndex].nodes.push(currentNode.id);
        }
      });
    }
  }
}
