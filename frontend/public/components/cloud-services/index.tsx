/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash';

export { AppTypesDetailsPage, AppTypesPage } from './apptype';
export { AppTypeResourcesDetailsPage } from './apptype-resource';

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

export const AppTypeLogo = (props: AppTypeLogoProps) => {
  const {icon, displayName, provider} = props;
  
  return <div className="co-apptype-logo">
    <div className="co-apptype-logo__icon">{ _.isEmpty(icon)
      ? <span className="fa ci-appcube" style={{fontSize: '40px'}} />
      : <img src={`data:${icon.mediatype};base64,${icon.base64data}`} height="40" width="40" /> }
    </div> 
    <div className="co-apptype-logo__name">
      <h1 className="co-apptype-logo__name__apptype">{displayName}</h1> 
      { provider && <span className="co-apptype-logo__name__provider">{`by ${provider.name}`}</span> }
    </div>
  </div>;
};

export type AppTypeLogoProps = {
  displayName: string;
  icon: {base64data: string, mediatype: string};
  provider: {name: string; website: string}
};
