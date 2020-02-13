import * as React from 'react';
import { Base64 } from 'js-base64';
import { k8sGet } from '@console/internal/module/k8s';
import { SecretModel, ConfigMapModel } from '@console/internal/models';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { CEPH_STORAGE_NAMESPACE } from '../../constants';

const createJSONFile = (data: Credentials) =>
  `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;

const ExportCredentials: React.FC<ModalComponentProps> = (props) => {
  const ref = React.useRef<HTMLAnchorElement>();
  const [payload, setPayload] = React.useState('');
  React.useEffect(() => {
    Promise.all([
      k8sGet(SecretModel, 'rook-ceph-mon', CEPH_STORAGE_NAMESPACE),
      k8sGet(ConfigMapModel, 'rook-ceph-mon-endpoints', CEPH_STORAGE_NAMESPACE),
    ])
      .then((data) => {
        const fsid = Base64.decode(data?.[0]?.data?.fsid);
        const adminSecret = Base64.decode(data?.[0]?.data?.['admin-secret']);
        const monIP = data?.[1]?.data?.data.split(',')?.[0];
        setPayload(
          createJSONFile({
            admin: adminSecret,
            monData: monIP,
            // Todo(bipuladh): Change this when OCS supports multiple NS's
            ns: CEPH_STORAGE_NAMESPACE,
            fsid,
          }),
        );
        ref.current.click();
        props.close();
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error exporting credentials', err);
        props.close();
      });
    // No need to run the effect multiple times
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <a
      id="downloadAnchorElem"
      href={payload}
      download="credentials.json"
      ref={ref}
      target="_blank"
      rel="noopener noreferrer"
    >
      Download
    </a>
  );
};

type Credentials = {
  admin: string;
  monData: string;
  ns: string;
  fsid: string;
};

export default createModalLauncher(ExportCredentials);
