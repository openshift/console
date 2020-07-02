import * as React from 'react';
import { Base64 } from 'js-base64';
import { SecretValue } from '@console/internal/components/configmap-and-secret-data';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import { K8sResourceKind, SecretKind, ConfigMapKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import { SectionHeading, EmptyBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { Button } from '@patternfly/react-core';
import { EyeSlashIcon, EyeIcon } from '@patternfly/react-icons';

export const GetSecret: React.FC<GetSecretProps> = ({ obj }) => {
  const [reveal, setReveal] = React.useState(false);

  const name = getName(obj);
  const namespace = getNamespace(obj);

  const [secretResource, cmResource] = React.useMemo(
    () => [
      {
        kind: SecretModel.kind,
        namespace,
        name,
        isList: false,
      },
      {
        kind: ConfigMapModel.kind,
        namespace,
        name,
        isList: false,
      },
    ],
    [name, namespace],
  );

  const [secretData, secretLoaded, secretLoadError] = useK8sWatchResource<SecretKind>(
    secretResource,
  );

  const [configData, configLoaded, configLoadError] = useK8sWatchResource<ConfigMapKind>(
    cmResource,
  );
  const isLoaded = secretLoaded && configLoaded;
  const error = secretLoadError || configLoadError;
  const bucketName = configData?.data?.BUCKET_NAME;
  const endpoint = `${configData?.data?.BUCKET_HOST}:${configData?.data?.BUCKET_PORT}`;
  const accessKey = isLoaded && !error ? Base64.decode(secretData?.data?.AWS_ACCESS_KEY_ID) : '';
  const secretKey =
    isLoaded && !error ? Base64.decode(secretData?.data?.AWS_SECRET_ACCESS_KEY) : '';

  const secretValues =
    isLoaded && !error
      ? [
          { field: 'Endpoint', value: endpoint },
          { field: 'Bucket Name', value: bucketName },
          { field: 'Access Key', value: accessKey },
          { field: 'Secret Key', value: secretKey },
        ]
      : [];

  const dl = secretValues.length
    ? secretValues.reduce((acc, datum) => {
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
        {secretValues.length ? (
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
