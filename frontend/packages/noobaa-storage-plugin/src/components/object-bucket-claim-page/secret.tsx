import * as React from 'react';
import * as _ from 'lodash';
import { Base64 } from 'js-base64';
import { SecretValue } from '@console/internal/components/configmap-and-secret-data';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import { k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import { SectionHeading, EmptyBox } from '@console/internal/components/utils';
import { Button } from '@patternfly/react-core';
import { EyeSlashIcon, EyeIcon } from '@patternfly/react-icons';

export const GetSecret: React.FC<GetSecretProps> = ({ obj }) => {
  const [reveal, setReveal] = React.useState(false);
  const [secretData, setSecretData] = React.useState([]);

  const name = getName(obj);
  const namespace = getNamespace(obj);

  React.useEffect(() => {
    const secret = k8sGet(SecretModel, name, namespace);
    const configMap = k8sGet(ConfigMapModel, name, namespace);
    Promise.all([secret, configMap])
      .then((data) => {
        const endpoint = `${_.get(data[1], 'data.BUCKET_HOST')}:${_.get(
          data[1],
          'data.BUCKET_PORT',
        )}`;
        const accessKey = Base64.decode(_.get(data[0], 'data.AWS_ACCESS_KEY_ID'));
        const secretKey = Base64.decode(_.get(data[0], 'data.AWS_SECRET_ACCESS_KEY'));
        const secretValues = [
          { field: 'Endpoint', value: endpoint },
          { field: 'Bucket Name', value: name },
          { field: 'Access Key', value: accessKey },
          { field: 'Secret Key', value: secretKey },
        ];
        setSecretData(secretValues);
      })
      .catch(() => undefined);
  }, [name, namespace]);

  const dl = secretData.length
    ? secretData.reduce((acc, datum) => {
        const { field, value } = datum;
        acc.push(<dt key={`${field}-k`}>{field}</dt>);
        acc.push(
          <dd key={`${field}-v`}>
            <SecretValue value={value} reveal={reveal} encoded={false} />
          </dd>,
        );
        return acc;
      }, [])
    : [];

  return dl.length ? (
    <div className="co-m-pane__body">
      <SectionHeading text="Object Bucket Claim Data">
        {secretData.length ? (
          <Button
            type="button"
            onClick={() => setReveal(!reveal)}
            variant="link"
            className="pf-m-link--align-right"
          >
            {reveal ? (
              <>
                <EyeSlashIcon className="co-icon-space-r" />
                Hide Values
              </>
            ) : (
              <>
                <EyeIcon className="co-icon-space-r" />
                Reveal Values
              </>
            )}
          </Button>
        ) : null}
      </SectionHeading>
      {dl.length ? <dl className="secret-data">{dl}</dl> : <EmptyBox label="Data" />}
    </div>
  ) : null;
};

type GetSecretProps = {
  obj: K8sResourceKind;
};
