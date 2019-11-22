import { $ } from 'protractor';

const nadDetailID = (namespace, nadName, itemName) => `#${namespace}-${nadName}-${itemName}`;

export const nadDetailName = (namespace, nadName) => $(nadDetailID(namespace, nadName, 'name'));
export const nadDetailDescription = (namespace, nadName) =>
  $(nadDetailID(namespace, nadName, 'description'));
export const nadDetailType = (namespace, nadName) => $(nadDetailID(namespace, nadName, 'type'));
