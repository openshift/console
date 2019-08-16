import * as _ from 'lodash';
import { Patch, TemplateKind } from '@console/internal/module/k8s';
import { VMLikeEntityKind, VMKind } from '../../../types';
import { getAnnotations, getDescription } from '../../../selectors/selectors';
import { getFlavor, getCPU, getMemory } from '../../../selectors/vm';
import { CUSTOM_FLAVOR, TEMPLATE_FLAVOR_LABEL } from '../../../constants';
import { selectVM } from '../../../selectors/vm-template/selectors';

const getLabelsPatch = (vm: VMKind): Patch | null => {
  if (!_.has(vm.metadata, 'labels')) {
    return {
      op: 'add',
      path: '/metadata/labels',
      value: {},
    };
  }
  return null;
};

const getDomainPatch = (vm: VMKind): Patch | null => {
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

const getUpdateFlavorPatch = (vm, flavor): Patch[] => {
  const patch = [];
  if (flavor !== getFlavor(vm)) {
    const labelKey = `${TEMPLATE_FLAVOR_LABEL}/${flavor}`.replace('~', '~0').replace('/', '~1');
    const labelPatch = getLabelsPatch(vm);
    if (labelPatch) {
      patch.push(labelPatch);
    }
    const flavorLabel = Object.keys(vm.metadata.labels || {}).find((key) =>
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

const getCpuPatch = (vm: VMKind, cpu: string): Patch => {
  if (!_.has(vm.spec, 'template.spec.domain.cpu')) {
    return {
      op: 'add',
      path: '/spec/template/spec/domain/cpu',
      value: {
        cores: parseInt(cpu, 10),
      },
    };
  }
  return {
    op: _.has(vm.spec, 'template.spec.domain.cpu.cores') ? 'replace' : 'add',
    path: '/spec/template/spec/domain/cpu/cores',
    value: parseInt(cpu, 10),
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

const getUpdateCpuMemoryPatch = (vm: VMKind, cpu: string, memory: string): Patch[] => {
  const patch = [];
  const vmCpu = getCPU(vm);
  const vmMemory = getMemory(vm);

  if (parseInt(cpu, 10) !== vmCpu || memory !== vmMemory) {
    const domainPatch = getDomainPatch(vm);
    if (domainPatch) {
      patch.push(domainPatch);
    }
  }

  if (parseInt(cpu, 10) !== vmCpu) {
    patch.push(getCpuPatch(vm, cpu));
  }

  if (memory !== vmMemory) {
    patch.push(getMemoryPatch(vm, memory));
  }

  return patch;
};

export const getUpdateDescriptionPatches = (
  vmLikeEntity: VMLikeEntityKind,
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
  vm: VMKind,
  template: TemplateKind,
  flavor: string,
  cpu?: string,
  mem?: string,
): Patch[] => {
  const patches = [];

  patches.push(...getUpdateFlavorPatch(vm, flavor));

  let customCpu = cpu;
  let customMem = mem;
  if (flavor !== CUSTOM_FLAVOR) {
    const templateVm = selectVM(template);
    customCpu = getCPU(templateVm);
    customMem = getMemory(templateVm);
  }
  patches.push(...getUpdateCpuMemoryPatch(vm, customCpu, customMem));

  return patches;
};
