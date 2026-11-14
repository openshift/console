import type { FC } from 'react';
import { useMemo, useState } from 'react';
import {
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Popover,
  SearchInput,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';

type MorePVCViewerProps = {
  limit: number;
  pvcNames: string[];
  namespace: string;
  isOpen?: boolean;
  onClose?: () => void;
};

type PVCResourceViewerProps = {
  limit: number;
  pvcNames: string[];
  asList?: boolean;
  namespace: string;
};

const PVCResourceViewerBody: FC<Omit<PVCResourceViewerProps, 'asList' | 'limit'>> = ({
  pvcNames,
  namespace,
}) => (
  <Stack hasGutter>
    {pvcNames.map((pvcName) => (
      <StackItem key={`pvc-${namespace}-${pvcName}`}>
        <ResourceLink
          kind={referenceForModel(PersistentVolumeClaimModel)}
          name={pvcName}
          namespace={namespace}
        />
      </StackItem>
    ))}
  </Stack>
);

const MorePVCViewer: FC<MorePVCViewerProps> = ({ pvcNames, namespace, isOpen, onClose }) => {
  const { t } = useTranslation('console-app');
  const [searchValue, setSearchValue] = useState('');

  const filteredPVCs = useMemo(
    () =>
      searchValue
        ? pvcNames.filter((pvcName) => pvcName.toLowerCase().includes(searchValue.toLowerCase()))
        : pvcNames,
    [pvcNames, searchValue],
  );

  const resultsCount = searchValue ? filteredPVCs.length : 0;

  const onChange = (newValue: string) => {
    setSearchValue(newValue);
  };

  const onClear = () => {
    setSearchValue('');
  };

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="more-pvc-viewer"
    >
      <ModalHeader title={t('Source PVCs')} labelId="more-pvc-viewer" />
      <ModalBody
        tabIndex={0}
        id="more-pvc-viewer-body-scrollable"
        aria-label="more-pvc-viewer-body-scrollable"
      >
        <div className="pf-v6-u-py-md">
          <SearchInput
            placeholder={t('Find by name')}
            value={searchValue}
            onChange={(_event, value) => onChange(value)}
            onClear={onClear}
            resultsCount={resultsCount}
          />
        </div>
        <PVCResourceViewerBody pvcNames={filteredPVCs} namespace={namespace} />
      </ModalBody>
    </Modal>
  );
};

export const PVCResourceViewer: FC<PVCResourceViewerProps> = ({
  limit,
  pvcNames,
  asList,
  namespace,
}) => {
  const { t } = useTranslation('console-app');
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalToggle = () => {
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
    setIsVisible(false);
  };

  const onClose = () => {
    setIsModalOpen(false);
    setIsVisible(false);
  };

  if (asList) {
    return (
      <>
        <Stack hasGutter className="pf-v6-u-mt-sm">
          <StackItem>
            <PVCResourceViewerBody pvcNames={pvcNames.slice(0, limit)} namespace={namespace} />
          </StackItem>
          {limit < pvcNames.length && (
            <StackItem>
              <Button variant={ButtonVariant.link} onClick={handleModalToggle}>
                {t('{{count}} more PVCs', { count: pvcNames.length - limit })}
              </Button>
            </StackItem>
          )}
        </Stack>
        <MorePVCViewer
          limit={limit}
          pvcNames={pvcNames}
          namespace={namespace}
          isOpen={isModalOpen}
          onClose={onClose}
        />
      </>
    );
  }

  return (
    <>
      <Popover
        isVisible={isVisible}
        shouldOpen={() => setIsVisible(true)}
        shouldClose={() => setIsVisible(false)}
        aria-label="pvc-resource-viewer"
        headerContent={<div>{t('Source PVCs')}</div>}
        bodyContent={
          <PVCResourceViewerBody pvcNames={pvcNames.slice(0, limit)} namespace={namespace} />
        }
        footerContent={
          limit < pvcNames.length ? (
            <Button variant={ButtonVariant.tertiary} onClick={handleModalToggle}>
              {t('{{count}} more PVCs', { count: pvcNames.length - limit })}
            </Button>
          ) : null
        }
      >
        <Button variant={ButtonVariant.link}>
          {t('{{count}} PVCs', { count: pvcNames.length })}
        </Button>
      </Popover>
      <MorePVCViewer
        onClose={onClose}
        isOpen={isModalOpen}
        limit={limit}
        pvcNames={pvcNames}
        namespace={namespace}
      />
    </>
  );
};
