import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownToggle,
} from '@patternfly/react-core';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ListKind } from 'public/module/k8s';
import NamespaceStoreModal from './namespace-store-modal';
import { NooBaaNamespaceStoreModel } from '../../models';
import { NamespaceStoreKind } from '../../types';

export const NamespaceStoreDropdown: React.FC<NamespaceStoreDropdownProps> = ({
  id,
  namespace,
  onChange,
  className,
  selectedKey,
}) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(false);
  const [nnsObj, nnsLoaded, nnsErr] = useK8sGet<ListKind<NamespaceStoreKind>>(
    NooBaaNamespaceStoreModel,
    null,
    namespace,
  );
  const [nsName, setNSName] = React.useState(selectedKey || '');
  const [dropdownItems, setDropdownItems] = React.useState([]);
  const nnsList = nnsLoaded ? nnsObj.items : [];
  const handleDropdownChange = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      setNSName(e.currentTarget.id);
      onChange(nnsList.find((nns) => nns?.metadata?.name === e.currentTarget.id));
    },
    [nnsList, onChange],
  );
  React.useEffect(() => {
    const nnsDropdownItems = nnsList.reduce(
      (res, nns) => {
        res.push(
          <DropdownItem
            key={nns.metadata.uid}
            component="button"
            id={nns?.metadata?.name}
            onClick={handleDropdownChange}
            data-test={nns?.metadata?.name}
            description={t('ceph-storage-plugin~Provider {{provider}} | Region: {{region}}', {
              provider: nns?.spec?.type,
              region: nns?.spec?.awsS3?.region,
            })}
          >
            {nns?.metadata?.name}
          </DropdownItem>,
        );
        return res;
      },
      [
        <DropdownItem
          data-test="create-new-namespacestore-button"
          key="first-item"
          component="button"
          onClick={() => NamespaceStoreModal({ namespace })}
        >
          {t('ceph-storage-plugin~Create new NamespaceStore ')}
        </DropdownItem>,
        <DropdownSeparator key="separator" />,
      ],
    );
    setDropdownItems(nnsDropdownItems);
  }, [nnsObj, nnsLoaded, nnsErr, nnsList, t, handleDropdownChange, namespace]);

  return (
    <div className={className}>
      {nnsErr && (
        <Alert
          className="nb-create-bc-step-page--danger"
          variant="danger"
          isInline
          title={t('ceph-storage-plugin~An error has occurred while fetching namespace stores')}
        />
      )}
      <Dropdown
        className="dropdown dropdown--full-width"
        toggle={
          <DropdownToggle
            id="nns-dropdown-id"
            data-test="nns-dropdown-toggle"
            onToggle={() => setOpen(!isOpen)}
          >
            {nsName || t('ceph-storage-plugin~Select a namespace store')}
          </DropdownToggle>
        }
        isOpen={isOpen}
        dropdownItems={dropdownItems}
        onSelect={() => setOpen(false)}
        id={id}
      />
    </div>
  );
};

type NamespaceStoreDropdownProps = {
  id: string;
  namespace: string;
  onChange?: (NamespaceStoreKind) => void;
  className?: string;
  selectedKey?: string;
};
