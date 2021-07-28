import * as React from 'react';
import * as _ from 'lodash';
import { isModelFeatureFlag, ModelFeatureFlag } from '@console/dynamic-plugin-sdk';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/api';

const ExtensionConsumer: React.FC = () => {
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);

  return !_.isEmpty(extensions) ? (
    <div>
      <h2>Extensions of type Console.flag/Model</h2>
      <div>
        {extensions.map((ext) => (
          <ModelRenderer
            model={ext.properties.model}
            flag={ext.properties.flag}
            key={ext.properties.flag}
          />
        ))}
      </div>
    </div>
  ) : null;
};

const ModelRenderer: React.FC<ModelRendererProps> = ({ model, flag }) => (
  <div>
    <div>Model Flag: {flag} </div>
    <div>Model Group, Version, Kind: </div>
    <ul>
      <li>{model.group}</li>
      <li>{model.version}</li>
      <li>{model.kind}</li>
    </ul>
  </div>
);

type ModelRendererProps = {
  model: {
    group: string;
    version: string;
    kind: string;
  };
  flag: string;
};

export default ExtensionConsumer;
