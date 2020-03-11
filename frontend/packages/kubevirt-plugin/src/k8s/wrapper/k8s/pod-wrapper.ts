import { ContainerSpec, K8sResourceCommon, PodKind, Volume } from '@console/internal/module/k8s';
import { PodModel } from '@console/internal/models';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { K8sInitAddon } from '../common/util/k8s-mixin';

export class PodWrappper extends K8sResourceWrapper<PodKind, PodWrappper> {
  constructor(pod?: K8sResourceCommon | PodWrappper | any, copy = false) {
    super(PodModel, pod, copy);
  }

  init(data: K8sInitAddon & { restartPolicy?: 'Always' | 'OnFailure' | 'Never' } = {}) {
    super.init(data);
    const { restartPolicy } = data;
    this.ensurePath('spec');
    this.setRestartPolicy(restartPolicy || 'Never');

    return this;
  }

  getContainers = () => this.data.spec?.containers;

  getVolumes = () => this.data.spec?.volumes;

  setServiceAccountName = (serviceAccountName: string) => {
    this.ensurePath('spec');
    this.data.spec.serviceAccountName = serviceAccountName;
    return this;
  };

  setRestartPolicy = (restartPolicy: 'Always' | 'OnFailure' | 'Never') => {
    this.ensurePath('spec');
    this.data.spec.restartPolicy = restartPolicy;
    return this;
  };

  addVolumes = (...volumes: Volume[]) => {
    this.ensurePath('spec.volumes', []);
    this.data.spec.volumes.push(...volumes);
    return this;
  };

  addContainers = (...containers: ContainerSpec[]) => {
    this.ensurePath('spec.containers', []);
    this.data.spec.containers.push(...containers);
    return this;
  };

  addInitContainers = (...initContainers: ContainerSpec[]) => {
    this.ensurePath('spec.initContainers', []);
    this.data.spec.initContainers.push(...initContainers);
    return this;
  };
}
