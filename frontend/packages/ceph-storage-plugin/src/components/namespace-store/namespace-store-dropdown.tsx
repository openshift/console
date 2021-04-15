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
import { getName } from '@console/shared';
import { ListKind } from 'public/module/k8s';
import NamespaceStoreModal from './namespace-store-modal';
import { NooBaaNamespaceStoreModel } from '../../models';
import { NamespaceStoreKind } from '../../types';
import { NamespacePolicyType } from '../../constants/bucket-class';

export const NamespaceStoreDropdown: React.FC<NamespaceStoreDropdownProps> = ({
  id,
  namespace,
  onChange,
  className,
  selectedKey,
  enabledItems,
  namespacePolicy,
  creatorDisabled,
}) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(false);
  const [nnsObj, nnsLoaded, nnsErr] = useK8sGet<ListKind<NamespaceStoreKind>>(
    NooBaaNamespaceStoreModel,
    null,
    namespace,
  );
  const [dropdownItems, setDropdownItems] = React.useState([]);
  const nnsList = nnsLoaded && !nnsErr ? nnsObj.items : [];
  React.useEffect(() => {
    const nnsDropdownItems = nnsList.reduce(
      (res, nns) => {
        const name = getName(nns);
        res.push(
          <DropdownItem
            key={nns.metadata.uid}
            component="button"
            id={name}
            isDisabled={
              namespacePolicy === NamespacePolicyType.MULTI &&
              !enabledItems.some((itemName) => itemName === name)
            }
            onClick={(e) =>
              onChange(nnsList.find((ns) => ns?.metadata?.name === e.currentTarget.id))
            }
            data-test={name}
            description={t('ceph-storage-plugin~Provider {{provider}} | Region: {{region}}', {
              provider: nns?.spec?.type,
              region: nns?.spec?.awsS3?.region,
            })}
          >
            {name}
          </DropdownItem>,
        );
        return res;
      },
      creatorDisabled
        ? []
        : [
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
  }, [
    nnsObj,
    nnsLoaded,
    nnsErr,
    nnsList,
    t,
    namespace,
    creatorDisabled,
    namespacePolicy,
    enabledItems,
    onChange,
  ]);

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
            isDisabled={
              !!nnsErr ||
              (namespacePolicy === NamespacePolicyType.MULTI && enabledItems?.length === 0)
            }
            data-test="nns-dropdown-toggle"
            onToggle={() => setOpen(!isOpen)}
          >
            {selectedKey || t('ceph-storage-plugin~Select a namespace store')}
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
  selectedKey: string;
  enabledItems?: string[];
  namespacePolicy?: NamespacePolicyType;
  creatorDisabled?: boolean;
};
