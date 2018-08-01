import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKind } from '../module/k8s';
import { SectionHeading, ResourceLink } from './utils';

export const ServiceCatalogParametersSecrets: React.SFC<ServiceCatalogParametersSecretsProps> = ({obj: obj}) => {
  const rows = _.map(obj.spec.parametersFrom, ({secretKeyRef}) => <div className="row" key={secretKeyRef.name}>
    <div className="col-xs-6">
      <ResourceLink kind="Secret" name={secretKeyRef.name} namespace={obj.metadata.namespace} />
    </div>
    <div className="col-xs-6">
      {secretKeyRef.key}
    </div>
  </div>
  );

  return <div className="co-m-pane__body">
    <SectionHeading text="Parameters Secrets" />
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <div className="row co-m-table-grid__head">
        <div className="col-xs-6">Secret</div>
        <div className="col-xs-6">Key</div>
      </div>
      <div className="co-m-table-grid__body">
        {rows}
      </div>
    </div>
  </div>;
};

export const ServiceCatalogParameters: React.SFC<ServiceCatalogParametersProps> = ({parameters}) => <div className="co-m-pane__body">
  <SectionHeading text="Parameters" />
  <dl className="co-m-resource__details">
    {_.map(parameters, (v, k) => <React.Fragment key={k}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </React.Fragment>
    )}
  </dl>
</div>;

/* eslint-disable no-undef */
export type ServiceCatalogParametersSecretsProps = {
  obj: K8sResourceKind,
};

export type ServiceCatalogParametersProps = {
  parameters: {
    [key: string]: string
  }
};
/* eslint-enable no-undef */
