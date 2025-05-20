import * as React from 'react';
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
import { ResourceLink } from '@console/internal/components/utils';
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

const PVCResourceViewerBody: React.FC<Omit<PVCResourceViewerProps, 'asList' | 'limit'>> = ({
  pvcNames,
  namespace,
}) => {
  return (
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
};

const MorePVCViewer: React.FC<MorePVCViewerProps> = ({ pvcNames, namespace, isOpen, onClose }) => {
  const [searchValue, setSearchValue] = React.useState('');
  const [resultsCount, setResultsCount] = React.useState(0);
  const [filteredPVCs, setFilteredPVCs] = React.useState(pvcNames || []);

  const onChange = (newValue: string) => {
    setSearchValue(newValue);
    const filtered = pvcNames.filter((pvcName) =>
      pvcName.toLowerCase().includes(newValue.toLowerCase()),
    );
    setFilteredPVCs(filtered);
    setResultsCount(filtered.length);
  };

  const onClear = () => {
    setSearchValue('');
    setResultsCount(0);
  };

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="more-pvc-viewer"
    >
      <ModalHeader title="Source PVCs" labelId="more-pvc-viewer" />
      <ModalBody
        tabIndex={0}
        id="more-pvc-viewer-body-scrollable"
        aria-label="more-pvc-viewer-body-scrollable"
      >
        <div className="pf-v6-u-py-md">
          <SearchInput
            placeholder="Find by name"
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

export const PVCResourceViewer: React.FC<PVCResourceViewerProps> = ({
  limit,
  pvcNames,
  asList,
  namespace,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

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
      <Stack hasGutter className="pf-v6-u-mt-sm">
        <StackItem>
          <PVCResourceViewerBody pvcNames={pvcNames.slice(0, limit)} namespace={namespace} />
        </StackItem>
        {limit < pvcNames.length && (
          <StackItem>
            <MorePVCViewer limit={limit} pvcNames={pvcNames} namespace={namespace} />
          </StackItem>
        )}
      </Stack>
    );
  }

  return (
    <>
      <Popover
        isVisible={isVisible}
        shouldOpen={() => setIsVisible(true)}
        shouldClose={() => setIsVisible(false)}
        aria-label="pvc-resource-viewer"
        headerContent={<div>{t('console-app~Source PVCs')}</div>}
        bodyContent={
          <PVCResourceViewerBody pvcNames={pvcNames.slice(0, limit)} namespace={namespace} />
        }
        footerContent={
          limit < pvcNames.length ? (
            <Button variant={ButtonVariant.tertiary} onClick={handleModalToggle}>
              {t('console-app~{{count}} more PVCs ', { count: pvcNames.length - limit })}
            </Button>
          ) : null
        }
      >
        <Button variant={ButtonVariant.link}>
          {t('console-app~{{count}} PVCs', { count: pvcNames.length })}
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
