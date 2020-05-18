import {
  asValidationObject,
  makeSentence,
  validateDNS1123SubdomainValue,
  ValidationErrorType,
  ValidationObject,
} from '@console/shared';
import { MAC_ADDRESS_INVALID_ERROR, NETWORK_REQUIRED, NIC_NAME_EXISTS } from '../strings';
import { NetworkInterfaceWrapper } from '../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../k8s/wrapper/vm/network-wrapper';
import { isValidMAC } from './validations';
import { UINetworkInterfaceValidation } from '../../../types/ui/nic';

export const validateNicName = (
  name: string,
  usedInterfacesNames: Set<string>,
  { subject } = { subject: 'Name' },
): ValidationObject => {
  let validation = validateDNS1123SubdomainValue(name, { subject });

  if (!validation && usedInterfacesNames && usedInterfacesNames.has(name)) {
    validation = asValidationObject(NIC_NAME_EXISTS);
  }

  return validation;
};

export const validateNetwork = (network: NetworkWrapper): ValidationObject => {
  if (!network.hasType()) {
    return asValidationObject(NETWORK_REQUIRED, ValidationErrorType.TrivialError);
  }

  return null;
};

export const validateMACAddress = (mac: string): ValidationObject => {
  const isValid = !mac || isValidMAC(mac);
  return isValid ? null : asValidationObject(makeSentence(MAC_ADDRESS_INVALID_ERROR));
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
