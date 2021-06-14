import * as Combinatorics from 'js-combinatorics';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { VirtualMachine } from '../models/virtualMachine';
import { VirtualMachineTemplate } from '../models/virtualMachineTemplate';
import { VMBuilder } from '../models/vmBuilder';
import { VMTemplateBuilder } from '../models/vmtemplateBuilder';
import { VMBuilderData, VMBuilderDataGenerationConfig } from '../types/vm';
import { ProvisionSource } from '../utils/constants/enums/provisionSource';
import { Flavor, OperatingSystem, TemplateByName, Workload } from '../utils/constants/wizard';
import { deepFreeze } from '../utils/utils';
import {
  containerRootDisk,
  flavorConfigs,
  getDiskToCloneFrom,
  multusNetworkInterface,
  rootDisk,
} from './mocks';

/**
 * Generates dictionary of VMBuilders based on baseBuilder, attributes and their values
 *
 * Example:
 * ```typescript
 * const baseVMBuilder = new VMBuilder()
 *  .setProvisionSource(ProvisionSource.CONTAINER)
 *  .setDisks([containerRootDisk])
 *  .setWorkload(Workload.DESKTOP)
 *  .setOS(OperatingSystem.RHEL7);
 * const generationConfig = { flavor: [{ flavor: flavorConfigs.Tiny }, { flavor: flavorConfigs.Small }] } as VMBuilderDataGenerationConfig;
 * const generated = generateBuilders(baseVMBuilder, generationConfig);
 * ```
 *  * generated dict will contain two VMBuilders, one with Tiny flavor and one with Small flavor:
 * {
 * 'config 0-0': {...baseVMBuilder.getData(), flavor: flavorConfigs.Tiny}
 * 'config 0-1': {...baseVMBuilder.getData(), flavor: flavorConfigs.Small}
 * }
 *
 * @param baseBuilder VMBuilder on which generated VM Builders are based (all generated
 * VMBuilders share the configuration of baseBuilder)
 * @param generationConfig VMBuilderDataGenerationConfig with attributes and values to generate the builders with
 * @return dictionary of generated VMBuilders
 */
const generateBuilders = (
  baseBuilder: VMBuilder,
  generationConfig: VMBuilderDataGenerationConfig,
) => {
  return [
    {
      baseBuilder,
      generationConfig,
    },
  ].reduce((_, { baseBuilder: builder, generationConfig: config }, idx) => {
    const configKeys = Object.keys(config);
    const valueArrays = configKeys.map((key) => config[key]);

    const newComputedBuilders: { [k: string]: VMBuilder } = {};
    Combinatorics.cartesianProduct(...valueArrays)
      .toArray()
      .forEach((additionalBuilderValues, additionalBuilderId) => {
        const additionalBuilderData = additionalBuilderValues.reduce((acc, value, keyIdx) => {
          acc[configKeys[keyIdx]] = value;
          return acc;
        }, {} as VMBuilderData);
        const additionalBuilder = new VMBuilder().setData(additionalBuilderData);
        newComputedBuilders[`config ${idx}-${additionalBuilderId}`] = new VMBuilder(builder)
          .setBuilderAttributes(additionalBuilder)
          .generateName(`${idx}-${additionalBuilderId}`);
      });
    return newComputedBuilders;
  }, {});
};

/**
 * List of generated
 */
export const computedVMBuilders = deepFreeze(
  generateBuilders(
    new VMBuilder()
      .setProvisionSource(ProvisionSource.CONTAINER)
      .setDescription('Generated VM')
      .setDisks([containerRootDisk]),
    {
      flavor: [{ flavor: Flavor.TINY }, { flavor: Flavor.SMALL }],
      workload: [Workload.DESKTOP, Workload.SERVER],
      os: [OperatingSystem.RHEL7, OperatingSystem.WINDOWS_10],
    } as VMBuilderDataGenerationConfig,
  ),
);

export const getBasicVMBuilder = () =>
  new VMBuilder()
    .setNamespace(testName)
    .setDescription('Default vm description')
    .setSelectTemplateName(TemplateByName.RHEL7)
    .setStartOnCreation(true);

export const getBasicVMTBuilder = () =>
  new VMTemplateBuilder()
    .setNamespace(testName)
    .setProvider('test provider')
    .setDescription('Default vmt description')
    .setFlavor(flavorConfigs.Tiny)
    .setOS(OperatingSystem.RHEL7)
    .setWorkload(Workload.DESKTOP);

export const vmPresets: { [k: string]: VirtualMachine } = {
  [ProvisionSource.CONTAINER.getValue()]: new VMBuilder(getBasicVMBuilder())
    .setProvisionSource(ProvisionSource.CONTAINER)
    .setDisks([containerRootDisk])
    .setNetworks([multusNetworkInterface])
    .setStartOnCreation(true)
    .build(),
  [ProvisionSource.URL.getValue()]: new VMBuilder(getBasicVMBuilder())
    .setProvisionSource(ProvisionSource.URL)
    .setDisks([rootDisk])
    .setNetworks([multusNetworkInterface])
    .setStartOnCreation(true)
    .build(),
  [ProvisionSource.PXE.getValue()]: new VMBuilder(getBasicVMBuilder())
    .setProvisionSource(ProvisionSource.PXE)
    .setDisks([rootDisk])
    .setCustomize(true)
    .setNetworks([multusNetworkInterface])
    .setStartOnCreation(false)
    .build(),
  [ProvisionSource.DISK.getValue()]: new VMBuilder(getBasicVMBuilder())
    .setProvisionSource(ProvisionSource.DISK)
    .setNetworks([multusNetworkInterface])
    .setPVCName(`testdv-${testName}`)
    .setDisks([getDiskToCloneFrom()])
    .setStartOnCreation(true)
    .build(),
};

export const VMTemplatePresets: { [k: string]: VirtualMachineTemplate } = {
  [ProvisionSource.CONTAINER.getValue()]: new VMTemplateBuilder(getBasicVMTBuilder())
    .setProvisionSource(ProvisionSource.CONTAINER)
    .setDisks([containerRootDisk])
    .setNetworks([multusNetworkInterface])
    .build(),
  [ProvisionSource.URL.getValue()]: new VMTemplateBuilder(getBasicVMTBuilder())
    .setProvisionSource(ProvisionSource.URL)
    .setDisks([rootDisk])
    .setNetworks([multusNetworkInterface])
    .build(),
  [ProvisionSource.PXE.getValue()]: new VMTemplateBuilder(getBasicVMTBuilder())
    .setProvisionSource(ProvisionSource.PXE)
    .setNetworks([multusNetworkInterface])
    .setDisks([rootDisk])
    .build(),
  [ProvisionSource.DISK.getValue()]: new VMTemplateBuilder(getBasicVMTBuilder())
    .setProvisionSource(ProvisionSource.DISK)
    .setPVCName(`testdv-${testName}`)
    .setNetworks([multusNetworkInterface])
    .build(),
};
