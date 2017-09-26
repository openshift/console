/* eslint-disable no-undef */

export { AppTypesDetailsPage, AppTypesPage } from './apptype';

export enum ALMCapabilites {
  metrics = 'urn:alm:capability:com.tectonic.ui:metrics',
  w3Link = 'urn:alm:capability:org.w3:link',
  tectonicLink = 'urn:alm:capability:com.tectonic.ui:important.link',
}

export type K8sResourceKind = {
  apiVersion: string;
  kind: string;
  metadata: {
    annotations?: {[key: string]: string},
    [key: string]: any,
  };
  spec: {
    selector?: {
      matchLabels?: {[key: string]: any},
    },
    [key: string]: any
  };
};

export type CustomResourceDefinitionKind = {

} & K8sResourceKind;

export type AppTypeKind = {

} & CustomResourceDefinitionKind;

export type AppTypeResourceKind = {
  outputs: {[name: string]: any};
} & K8sResourceKind;
