import * as _ from 'lodash';
import { Patch, TemplateKind } from '@console/internal/module/k8s';
import { VMGenericLikeEntityKind, VMLikeEntityKind } from '../../../types/vmLike';
import { getAnnotations, getDescription } from '../../../selectors/selectors';
import { getFlavor, getCPU, getMemory, parseCPU, DEFAULT_CPU } from '../../../selectors/vm';
import { isTemplate, isVM } from '../../../selectors/check-type';
import { TEMPLATE_FLAVOR_LABEL, TEMPLATE_VM_SIZE_LABEL } from '../../../constants';
import { getVMLikePatches } from '../vm-template';
import { selectVM } from '../../../selectors/vm-template/basic';
import { CPU, VMITemplate, VMKind } from '../../../types/vm';
import { PatchBuilder } from '@console/shared/src/k8s';
import { getLabels } from '@console/shared/src';
import { isCustomFlavor } from '../../../selectors/vm-like/flavor';

const getDomainPatches = (vm: VMKind): Patch[] => {
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
  return patch ? [patch] : [];
};

const getUpdateFlavorPatchesImpl = (
  vmLike: VMLikeEntityKind | VMITemplate,
  oldFlavor,
  newFlavor: string,
): Patch[] => {
  const path =
    isVM(vmLike) || isTemplate(vmLike) ? '/metadata/labels' : '/spec/template/metadata/labels'; // or VMITemplate

  const patches = [];
  // also remove old unused Custom labels
  if (isCustomFlavor(newFlavor) || oldFlavor !== newFlavor) {
    const labels = getLabels(vmLike);
    const flavorLabel = Object.keys(labels || {}).find((key) =>
      key.startsWith(TEMPLATE_FLAVOR_LABEL),
    );
    if (flavorLabel) {
      patches.push(new PatchBuilder(path).setObjectRemove(flavorLabel, labels).build());
    }
    if (!isCustomFlavor(newFlavor)) {
      patches.push(
        new PatchBuilder(path)
          .setObjectUpdate(`${TEMPLATE_FLAVOR_LABEL}/${newFlavor}`, 'true', labels)
          .build(),
      );
    }
  }
  return patches;
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
  const patches = [];
  const oldCPU = getCPU(vm);
  const vmMemory = getMemory(vm);

  patches.push(
    new PatchBuilder('/spec/template/spec/domain/cpu')
      .setObjectUpdate('sockets', cpu?.sockets, oldCPU)
      .build(),
  );
  patches.push(
    new PatchBuilder('/spec/template/spec/domain/cpu')
      .setObjectUpdate('threads', cpu?.threads, oldCPU || {}) // created by the patch before
      .build(),
  );
  patches.push(
    new PatchBuilder('/spec/template/spec/domain/cpu')
      .setObjectUpdate('cores', cpu?.cores, oldCPU || {})
      .build(),
  );

  if (memory !== vmMemory) {
    patches.push(getMemoryPatch(vm, memory));
  }

  return patches.length > 0 ? [...getDomainPatches(vm), ...patches] : patches;
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

const getSizeLabelPatch = (flavor: string, vmi: VMITemplate): Patch[] => {
  const patches = [];

  if (isCustomFlavor(flavor)) {
    patches.push(
      new PatchBuilder('/spec/template/metadata/labels')
        .setObjectRemove(TEMPLATE_VM_SIZE_LABEL, getLabels(vmi))
        .build(),
    );
  } else {
    patches.push(
      new PatchBuilder('/spec/template/metadata/labels')
        .setObjectUpdate(TEMPLATE_VM_SIZE_LABEL, flavor, getLabels(vmi))
        .build(),
    );
  }

  return patches;
};

export const getUpdateFlavorPatches = (
  vmLike: VMLikeEntityKind,
  template: TemplateKind,
  flavor: string,
  cpu?: number,
  mem?: string,
): Patch[] => {
  const oldFlavor = getFlavor(vmLike);
  let customCpu = {
    sockets: 1,
    cores: cpu,
    threads: 1,
  };
  let customMem = mem;
  if (!isCustomFlavor(flavor)) {
    const templateVm = selectVM(template);
    customCpu = parseCPU(getCPU(templateVm), DEFAULT_CPU);
    customMem = getMemory(templateVm);
  }

  return [
    ...getUpdateFlavorPatchesImpl(vmLike, oldFlavor, flavor),
    ...getVMLikePatches(vmLike, (vm: VMKind) => {
      const vmi = vm.spec?.template;
      const additionalPatches = [
        ...getSizeLabelPatch(flavor, vmi),
        ...getUpdateCpuMemoryPatch(vm, customCpu, customMem),
      ];

      if (isVM(vmLike)) {
        additionalPatches.push(...getUpdateFlavorPatchesImpl(vmi, oldFlavor, flavor));
      }
      return additionalPatches;
    }),
  ];
};
