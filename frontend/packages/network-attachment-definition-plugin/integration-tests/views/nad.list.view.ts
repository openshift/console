import { by, element } from 'protractor';

export const nadListByName = (nadName) => element(by.linkText(nadName));
