import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, FormGroup, Title } from '@patternfly/react-core';
import { getName } from '@console/shared';
import { Action, State } from '../../state';
import { NamespaceStoreDropdown } from '../../../namespace-store/namespace-store-dropdown';
import { NamespaceStoreKind } from '../../../../types';

export const SingleNamespaceStorePage: React.FC<SingleNamespaceStoreProps> = React.memo(
  ({ dispatch, namespace, state, hideCreateNamespaceStore }) => {
    const { t } = useTranslation();
    const handleNSStateChange = (selectedNamespaceStore: NamespaceStoreKind) => {
      dispatch({ type: 'setWriteNamespaceStore', value: [selectedNamespaceStore] });
      dispatch({ type: 'setReadNamespaceStore', value: [selectedNamespaceStore] });
    };
    return (
      <div>
        <Title size="xl" headingLevel="h2" className="nb-bc-step-page-form__title">
          {t('ceph-storage-plugin~Read and Write NamespaceStore ')}
        </Title>
        <p className="nb-create-bc-step-page-form__element--light-text">
          {t(
            'ceph-storage-plugin~Select one NamespaceStore which defines the read and write targets of the namespace bucket.',
          )}
        </p>
        <Form>
          <FormGroup className="nb-create-bc-step-page-form" fieldId="namespacestore-input">
            <NamespaceStoreDropdown
              id="namespacestore-input"
              className="nb-create-bc-step-page-form__dropdown"
              namespace={namespace}
              onChange={handleNSStateChange}
              selectedKey={getName(state.readNamespaceStore[0])}
              creatorDisabled={hideCreateNamespaceStore}
            />
          </FormGroup>
        </Form>
      </div>
    );
  },
);

type SingleNamespaceStoreProps = {
  dispatch: React.Dispatch<Action>;
  namespace?: string;
  state: State;
  hideCreateNamespaceStore?: boolean;
};
