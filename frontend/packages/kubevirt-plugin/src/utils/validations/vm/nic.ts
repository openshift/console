import { validateDNS1123SubdomainValue } from '../..';
import { NetworkInterfaceWrapper } from '../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../k8s/wrapper/vm/network-wrapper';
import { asValidationObject, ValidationErrorType, ValidationObject } from '../../../selectors';
import { UINetworkInterfaceValidation } from '../../../types/ui/nic';
import { isValidMAC } from './validations';

export const validateNicName = (
  name: string,
  usedInterfacesNames: Set<string>,
): ValidationObject => {
  let validation = validateDNS1123SubdomainValue(name, {
    // t('kubevirt-plugin~NIC name cannot be empty')
    // t('kubevirt-plugin~NIC name name can contain only alphanumeric characters')
    // t('kubevirt-plugin~NIC name must start/end with alphanumeric character')
    // t('kubevirt-plugin~NIC name cannot contain uppercase characters')
    // t('kubevirt-plugin~NIC name is too long')
    // t('kubevirt-plugin~NIC name is too short')
    emptyMsg: 'kubevirt-plugin~NIC name cannot be empty',
    errorMsg: 'kubevirt-plugin~NIC name name can contain only alphanumeric characters',
    startEndAlphanumbericMsg: 'kubevirt-plugin~NIC name must start/end with alphanumeric character',
    uppercaseMsg: 'kubevirt-plugin~NIC name cannot contain uppercase characters',
    longMsg: 'kubevirt-plugin~NIC name is too long',
    shortMsg: 'kubevirt-plugin~NIC name is too short',
  });

  if (!validation && usedInterfacesNames && usedInterfacesNames.has(name)) {
    // t('kubevirt-plugin~Interface with this name already exists')
    validation = asValidationObject('kubevirt-plugin~Interface with this name already exists');
  }

  return validation;
};

export const validateNetwork = (network: NetworkWrapper): ValidationObject => {
  if (!network.hasType()) {
    // t('kubevirt-plugin~Network required)
    return asValidationObject('kubevirt-plugin~Network required', ValidationErrorType.TrivialError);
  }

  return null;
};

export const validateMACAddress = (mac: string): ValidationObject => {
  const isValid = !mac || isValidMAC(mac);
  // t('kubevirt-plugin~Invalid MAC address format')
  return isValid ? null : asValidationObject('kubevirt-plugin~Invalid MAC address format');
};

export const validateNIC = (
  interfaceWrapper: NetworkInterfaceWrapper,
  network: NetworkWrapper,
  {
    usedInterfacesNames,
    acceptEmptyNetwork,
  }: {
    usedInterfacesNames?: Set<string>;
    acceptEmptyNetwork?: boolean; // do not use for strict validation
  },
): UINetworkInterfaceValidation => {
  const validations = {
    name: validateNicName(interfaceWrapper && interfaceWrapper.getName(), usedInterfacesNames),
    macAddress: validateMACAddress(interfaceWrapper && interfaceWrapper.getMACAddress()),
    network: validateNetwork(network),
  };

  let hasAllRequiredFilled =
    interfaceWrapper &&
    interfaceWrapper.getName() &&
    interfaceWrapper.getModel() &&
    interfaceWrapper.hasType();

  if (!acceptEmptyNetwork) {
    hasAllRequiredFilled =
      hasAllRequiredFilled && network && network.getReadableName() && network.hasType();
  }

  return {
    validations,
    hasAllRequiredFilled: !!hasAllRequiredFilled,
    isValid:
      !!hasAllRequiredFilled &&
      !Object.keys(validations)
        .filter((key) => !(acceptEmptyNetwork && key === 'network'))
        .find((key) => validations[key]),
  };
};
