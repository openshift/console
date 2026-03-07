import type { FC, FormEventHandler } from 'react';
import { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Form,
  FormGroup,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import type { SimpleSelectOption } from '@patternfly/react-templates';
import { SimpleSelect } from '@patternfly/react-templates';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { DetailsItem } from '@console/internal/components/utils/details-item';
import { k8sPatch } from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { CatalogSourceModel } from '../models';
import type { CatalogSourceKind } from '../types';

const getPollIntervals = (selected: string): SimpleSelectOption[] => {
  const intervals = ['10m', '15m', '30m', '45m', '60m'];
  if (!intervals.includes(selected)) {
    intervals.unshift(selected);
  }
  return intervals.map((interval) => ({
    content: interval,
    value: interval,
    selected: selected === interval,
    'data-test-dropdown-menu': interval,
  }));
};

type RegistryPollIntervalDetailItemProps = {
  catalogSource: CatalogSourceKind;
};

export const RegistryPollIntervalDetailItem: FC<RegistryPollIntervalDetailItemProps> = ({
  catalogSource,
}) => {
  const { t } = useTranslation('olm');
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pollInterval = useMemo(() => {
    let initialValue = catalogSource.spec?.updateStrategy?.registryPoll?.interval || '';
    if (initialValue.endsWith('0s')) {
      initialValue = initialValue.substring(0, initialValue.length - 2);
    }
    return initialValue;
  }, [catalogSource.spec.updateStrategy?.registryPoll?.interval]);

  const [selectedPollInterval, setSelectedPollInterval] = useState<string>(pollInterval);
  const items = useMemo<SimpleSelectOption[]>(() => {
    return getPollIntervals(selectedPollInterval);
  }, [selectedPollInterval]);

  // if the CatalogSource is managed, we can't edit the poll interval
  const managedBy = catalogSource.metadata?.annotations?.['operatorframework.io/managed-by'];

  // reset value on modal open
  useEffect(() => {
    if (isModalOpen) {
      setSelectedPollInterval(pollInterval);
    }
  }, [pollInterval, isModalOpen]);

  const submit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const patch = [
      {
        op: 'add',
        path: '/spec/updateStrategy/registryPoll/interval',
        value: selectedPollInterval,
      },
    ];
    return handlePromise(k8sPatch(CatalogSourceModel, catalogSource, patch)).then(() => {
      setIsModalOpen(false);
    });
  };

  return (
    <>
      <DetailsItem
        label={t('Registry poll interval')}
        obj={catalogSource}
        path="spec.updateStrategy.registryPoll.interval"
        canEdit={!_.isEmpty(catalogSource.spec.updateStrategy) && !managedBy}
        onEdit={() => setIsModalOpen(true)}
      />
      <Modal
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        aria-labelledby="olm-poll-registry-interval-form-title"
        aria-describedby="olm-poll-registry-interval-form"
      >
        <ModalHeader
          title={t('Edit registry poll interval')}
          descriptorId="olm-poll-registry-interval-form"
          labelId="olm-poll-registry-interval-form-title"
          data-test="registry-poll-interval-modal-title"
        />
        <ModalBody>
          <Form onSubmit={submit} id="olm-poll-registry-interval-form-form">
            <FormGroup label={t('Registry poll interval')} fieldId="pollInterval_dropdown">
              <SimpleSelect
                id="pollInterval_dropdown"
                toggleProps={{
                  isFullWidth: true,
                  // @ts-expect-error non-prop attribute is used for cypress
                  'data-test': 'registry-poll-interval-dropdown',
                }}
                initialOptions={items}
                onSelect={(_event, value) => setSelectedPollInterval(value as string)}
              />
            </FormGroup>
          </Form>
          {errorMessage && (
            <HelperText isLiveRegion className="pf-v6-u-mt-md">
              <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
            </HelperText>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            key="confirm-action"
            variant="primary"
            isLoading={inProgress}
            type="submit"
            form="olm-poll-registry-interval-form-form"
            isDisabled={
              selectedPollInterval === catalogSource.spec?.updateStrategy?.registryPoll?.interval
            }
          >
            {t('Save')}
          </Button>
          <Button
            key="cancel"
            variant="link"
            onClick={() => {
              setIsModalOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
