import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownToggle,
} from '@patternfly/react-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useDeepCompareMemoize, getName } from '@console/shared';
import NamespaceStoreModal from './namespace-store-modal';
import { NamespaceStoreKind } from '../../types';
import { NamespacePolicyType } from '../../constants/bucket-class';
import { namespaceStoreResource } from '../../resources';

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
  const [dropdownItems, setDropdownItems] = React.useState<JSX.Element[]>([]);

  const [nnsData, , nnsLoadErr] = useK8sWatchResource<NamespaceStoreKind[]>(namespaceStoreResource);
  const noobaaNamespaceStores: NamespaceStoreKind[] = useDeepCompareMemoize(nnsData, true);

  React.useEffect(() => {
    const nnsDropdownItems = noobaaNamespaceStores.reduce(
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
              onChange(
                noobaaNamespaceStores.find((ns) => ns?.metadata?.name === e.currentTarget.id),
              )
            }
            data-test={`${name}-dropdown-item`}
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
    noobaaNamespaceStores,
    t,
    namespace,
    creatorDisabled,
    namespacePolicy,
    enabledItems,
    onChange,
  ]);

  return (
    <div className={className}>
      {nnsLoadErr && (
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
              !!nnsLoadErr ||
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
