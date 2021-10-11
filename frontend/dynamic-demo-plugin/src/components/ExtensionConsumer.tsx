import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  useResolvedExtensions,
  isModelFeatureFlag,
  ModelFeatureFlag,
} from '@openshift-console/dynamic-plugin-sdk';

const ExtensionConsumer: React.FC = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);

  return !_.isEmpty(extensions) ? (
    <div>
      <h2>{t('Extensions of type Console.flag/Model')}</h2>
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

const ModelRenderer: React.FC<ModelRendererProps> = ({ model, flag }) => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  return (
    <div>
      <div>{t('Model Flag: {{flag}}', { flag })}</div>
      <div>{t('Model Group, Version, Kind:')}</div>
      <ul>
        <li>{model.group}</li>
        <li>{model.version}</li>
        <li>{model.kind}</li>
      </ul>
    </div>
  );
};

type ModelRendererProps = {
  model: {
    group: string;
    version: string;
    kind: string;
  };
  flag: string;
};

export default ExtensionConsumer;
