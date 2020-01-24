import * as _ from 'lodash';
import { Patch, TemplateKind } from '@console/internal/module/k8s';
import { VMGenericLikeEntityKind, VMLikeEntityKind } from '../../../types/vmLike';
import { getAnnotations, getDescription } from '../../../selectors/selectors';
import { getFlavor, getCPU, getMemory, isVM, parseCPU, DEFAULT_CPU } from '../../../selectors/vm';
import { CUSTOM_FLAVOR, TEMPLATE_FLAVOR_LABEL } from '../../../constants';
import { getTemplateForFlavor } from '../../../selectors/vm-template/selectors';
import { getVMLikePatches } from '../vm-template';
import { isCPUEqual } from '../../../utils';
import { selectVM } from '../../../selectors/vm-template/basic';
import { CPU, VMKind } from '../../../types/vm';

const getLabelsPatch = (vmLike: VMLikeEntityKind): Patch => {
  if (!_.has(vmLike.metadata, 'labels')) {
    return {
      op: 'add',
      path: '/metadata/labels',
      value: {},
    };
  }
  return null;
};

const getDomainPatch = (vm: VMKind): Patch => {
  let patch: Patch = null;
  if (!_.has(vm, 'spec')) {
    patch = {
      op: 'add',
      path: '/spec',
      value: {
        template: {
          spec: {
            domain: {},
          },
        },
      },
    };
  } else if (!_.has(vm.spec, 'template')) {
    patch = {
      op: 'add',
      path: '/spec/template',
      value: {
        spec: {
          domain: {},
        },
      },
    };
  } else if (!_.has(vm.spec.template, 'spec')) {
    patch = {
      op: 'add',
      path: '/spec/template/spec',
      value: {
        domain: {},
      },
    };
  } else if (!_.has(vm.spec.template.spec, 'domain')) {
    patch = {
      op: 'add',
      path: '/spec/template/spec/domain',
      value: {},
    };
  }
  return patch;
};

const getUpdateFlavorPatch = (vmLike: VMLikeEntityKind, flavor: string): Patch[] => {
  const patch = [];
  if (flavor !== getFlavor(vmLike)) {
    const labelKey = `${TEMPLATE_FLAVOR_LABEL}/${flavor}`.replace('~', '~0').replace('/', '~1');
    const labelPatch = getLabelsPatch(vmLike);
    if (labelPatch) {
      patch.push(labelPatch);
    }
    const flavorLabel = Object.keys(vmLike.metadata.labels || {}).find((key) =>
      key.startsWith(TEMPLATE_FLAVOR_LABEL),
    );
    if (flavorLabel) {
      const flavorParts = flavorLabel.split('/');
      if (flavorParts[flavorParts.length - 1] !== flavor) {
        const escapedLabel = flavorLabel.replace('~', '~0').replace('/', '~1');
        patch.push({
          op: 'remove',
          path: `/metadata/labels/${escapedLabel}`,
        });
      }
    }
    patch.push({
      op: 'add',
      path: `/metadata/labels/${labelKey}`,
      value: 'true',
    });
  }
  return patch;
};

const getCpuPatch = (vm: VMKind, cpu: CPU): Patch => {
  return {
    op: _.has(vm.spec, 'template.spec.domain.cpu') ? 'replace' : 'add',
    path: '/spec/template/spec/domain/cpu',
    value: {
      sockets: cpu.sockets,
      cores: cpu.cores,
      threads: cpu.threads,
    },
  };
};

const getMemoryPatch = (vm: VMKind, memory: string): Patch => {
  if (!_.has(vm.spec, 'template.spec.domain.resources')) {
    return {
      op: 'add',
      path: '/spec/template/spec/domain/resources',
      value: {
        requests: {
          memory,
        },
      },
    };
  }
  if (!_.has(vm.spec, 'template.spec.domain.resources.requests')) {
    return {
      op: 'add',
      path: '/spec/template/spec/domain/resources/requests',
      value: {
        memory,
      },
    };
  }
  return {
    op: _.has(vm.spec, 'template.spec.domain.resources.requests.memory') ? 'replace' : 'add',
    path: '/spec/template/spec/domain/resources/requests/memory',
    value: memory,
  };
};

const getUpdateCpuMemoryPatch = (vm: VMKind, cpu: CPU, memory: string): Patch[] => {
  const patch = [];
  const vmCpu = parseCPU(getCPU(vm));
  const vmMemory = getMemory(vm);

  if (memory !== vmMemory || !isCPUEqual(cpu, vmCpu)) {
    const domainPatch = getDomainPatch(vm);
    if (domainPatch) {
      patch.push(domainPatch);
    }
  }

  if (!isCPUEqual(cpu, vmCpu)) {
    patch.push(getCpuPatch(vm, cpu));
  }

  if (memory !== vmMemory) {
    patch.push(getMemoryPatch(vm, memory));
  }

  return patch;
};

export const getUpdateDescriptionPatches = (
  vmLikeEntity: VMGenericLikeEntityKind,
  description: string,
): Patch[] => {
  const patches = [];
  const oldDescription = getDescription(vmLikeEntity);
  const annotations = getAnnotations(vmLikeEntity, null);

  if (description !== oldDescription) {
    if (!description && oldDescription) {
      patches.push({
        op: 'remove',
        path: '/metadata/annotations/description',
      });
    } else if (!annotations) {
      patches.push({
        op: 'add',
        path: '/metadata/annotations',
        value: {
          description,
        },
      });
    } else {
      patches.push({
        op: oldDescription ? 'replace' : 'add',
        path: '/metadata/annotations/description',
        value: description,
      });
    }
  }
  return patches;
};

export const getUpdateFlavorPatches = (
  vmLike: VMLikeEntityKind,
  templates: TemplateKind[],
  flavor: string,
  cpu?: number,
  mem?: string,
): Patch[] => {
  const patches = [];

  // TODO: vm.kubevirt.io/template label should be changed as well (vm.kubevirt.io/template: win2k12r2-server-large)
  // TODO: by changing flavor and so the base template, VM devices can be changed as well and so "full delta" should be applied here.
  // Considering recent kubevirt state, updating cpu and sockets is good enough for now, but should be enhanced in the future.

  let template;
  if (isVM(vmLike)) {
    template = getTemplateForFlavor(templates, vmLike as VMKind, flavor);
  } else {
    const vm = selectVM(vmLike as TemplateKind);
    template = getTemplateForFlavor(templates, vm, flavor);
  }

  // flavor is set on object.metadata.label level for both VM and VMTemplate
  patches.push(...getUpdateFlavorPatch(vmLike, flavor));

  let customCpu = {
    sockets: 1,
    cores: cpu,
    threads: 1,
  };
  let customMem = mem;
  if (flavor !== CUSTOM_FLAVOR) {
    const templateVm = selectVM(template);
    customCpu = parseCPU(getCPU(templateVm), DEFAULT_CPU);
    customMem = getMemory(templateVm);
  }

  let cpuMemPatches;
  if (isVM(vmLike)) {
    cpuMemPatches = getUpdateCpuMemoryPatch(vmLike as VMKind, customCpu, customMem);
  } else {
    cpuMemPatches = getVMLikePatches(vmLike, (vm: VMKind) =>
      getUpdateCpuMemoryPatch(vm, customCpu, customMem),
    );
  }
  patches.push(...cpuMemPatches);

  return patches;
};
