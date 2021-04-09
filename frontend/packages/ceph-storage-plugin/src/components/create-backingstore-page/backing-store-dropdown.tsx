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
import CreateBackingStoreFormModal from './create-bs-modal';
import { NooBaaBackingStoreModel } from '../../models';
import { BackingStoreKind } from '../../types';

export const BackingStoreDropdown: React.FC<BackingStoreDropdownProps> = ({
  id,
  namespace,
  onChange,
  className,
  selectedKey,
  creatorDisabled,
}) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(false);
  const [nbsObj, nbsLoaded, nbsErr] = useK8sGet<ListKind<BackingStoreKind>>(
    NooBaaBackingStoreModel,
    null,
    namespace,
  );
  const [nsName, setNSName] = React.useState('');
  const nbsList = nbsLoaded && !nbsErr ? nbsObj.items : [];
  const handleDropdownChange = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      setNSName(e.currentTarget.id);
      onChange(nbsList.find((nbs) => nbs?.metadata?.name === e.currentTarget.id));
    },
    [nbsList, onChange],
  );

  const getDropdownItems = React.useCallback(
    (backingStoreList: BackingStoreKind[]) => {
      return backingStoreList.reduce(
        (res, nbs) => {
          res.push(
            <DropdownItem
              key={nbs.metadata.uid}
              component="button"
              id={nbs?.metadata?.name}
              onClick={handleDropdownChange}
              data-test={nbs?.metadata?.name}
              description={t('ceph-storage-plugin~Provider {{provider}}', {
                provider: nbs?.spec?.type,
              })}
            >
              {nbs?.metadata?.name}
            </DropdownItem>,
          );
          return res;
        },
        !creatorDisabled
          ? [
              <DropdownItem
                data-test="create-new-backingstore-button"
                key="first-item"
                component="button"
                onClick={() => CreateBackingStoreFormModal({ namespace })}
              >
                {t('ceph-storage-plugin~Create new BackingStore ')}
              </DropdownItem>,
              <DropdownSeparator key="separator" />,
            ]
          : [],
      );
    },
    [creatorDisabled, t, handleDropdownChange, namespace],
  );

  const dropdownItems = getDropdownItems(nbsList);

  return (
    <div className={className}>
      {nbsErr && (
        <Alert
          className="nb-create-bc-step-page__danger"
          variant="danger"
          isInline
          title={t('ceph-storage-plugin~An error has occured while fetching backing stores')}
        />
      )}
      <Dropdown
        className="dropdown dropdown--full-width"
        toggle={
          <DropdownToggle
            id="nbs-dropdown-id"
            data-test="nbs-dropdown-toggle"
            onToggle={() => setOpen(!isOpen)}
            isDisabled={!!nbsErr}
          >
            {selectedKey || nsName || t('ceph-storage-plugin~Select a backing store')}
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

type BackingStoreDropdownProps = {
  id: string;
  namespace: string;
  onChange?: (BackingStoreKind) => void;
  className?: string;
  selectedKey?: string;
  creatorDisabled?: boolean;
};
