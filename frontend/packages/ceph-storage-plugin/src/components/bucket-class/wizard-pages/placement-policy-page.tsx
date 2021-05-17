import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertActionCloseButton, Button, Radio, Title, Form } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { Action, State } from '../state';
import { PlacementPolicy } from '../../../types';

const PlacementPolicyPage: React.FC<PlacementPolicyPageProps> = ({ dispatch, state }) => {
  const { t } = useTranslation();

  const { tier1Policy, tier2Policy } = state;
  const [showHelp, setShowHelp] = React.useState(true);
  const showTier2 = !!tier2Policy;

  const onChange = (checked: boolean, event) => {
    const { name, value } = event.target;
    if (name === 'placement-policy-1') {
      dispatch({ type: 'setPlacementPolicyTier1', value });
    } else if (name === 'placement-policy-2') {
      dispatch({ type: 'setPlacementPolicyTier2', value });
    }
  };
  return (
    <div className="nb-create-bc-step-page">
      {showHelp && (
        <Alert
          isInline
          variant="info"
          title={t('ceph-storage-plugin~What is a Placement Policy?')}
          className="nb-create-bc-step-page__info"
          actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
        >
          <p>
            {t(
              'ceph-storage-plugin~Data placement capabilities are built as a multi-layer structure here are the layers bottom-up:',
            )}
          </p>
          <ul>
            <li>
              {t(
                'ceph-storage-plugin~Spread Tier - list of BackingStores aggregates the storage of multiple stores.',
              )}
            </li>
            <li>
              {t(
                'ceph-storage-plugin~Mirroring Tier - list of spread-layers async-mirroring to all mirrors with locality optimization (will allocate on the closest region to the source endpoint). Mirroring requires at least two BackingStores.',
              )}
            </li>
          </ul>
          {t(
            'ceph-storage-plugin~The number of replicas can be configured via the NooBaa management console.',
          )}
        </Alert>
      )}
      <Form className="nb-create-bc-step-page-form">
        <Title size="xl" headingLevel="h2" className="nb-bc-step-page-form__title">
          {t('ceph-storage-plugin~Tier 1 - Policy Type')}
        </Title>
        <Radio
          data-test="placement-policy-spread1"
          value={PlacementPolicy.Spread}
          isChecked={tier1Policy === PlacementPolicy.Spread}
          onChange={onChange}
          id="radio-1"
          label={t('ceph-storage-plugin~Spread')}
          name="placement-policy-1"
        />
        <p className="nb-create-bc-step-page-form__element--light-text">
          {t(
            'ceph-storage-plugin~Spreading the data across the chosen resources. By default a replica of one copy is used and does not include failure tolerance in case of resource failure.',
          )}
        </p>
        <Radio
          data-test="placement-policy-mirror1"
          value={PlacementPolicy.Mirror}
          isChecked={tier1Policy === PlacementPolicy.Mirror}
          onChange={onChange}
          id="radio-2"
          label={t('ceph-storage-plugin~Mirror')}
          name="placement-policy-1"
        />
        <p className="nb-create-bc-step-page-form__element--light-text">
          {t(
            'ceph-storage-plugin~Full duplication of the data in each chosen resource. By default a replica of one copy per location is used. Includes failure tolerance in case of resource failure.',
          )}
        </p>
      </Form>
      {!showTier2 && (
        <Button
          variant="link"
          icon={<PlusCircleIcon />}
          onClick={() =>
            dispatch({ type: 'setPlacementPolicyTier2', value: PlacementPolicy.Spread })
          }
          isInline
          data-testid="add-tier-btn"
          data-test="add-tier-btn"
        >
          {t('ceph-storage-plugin~Add Tier')}
        </Button>
      )}
      {showTier2 && (
        <Form className="nb-create-bc-step-page-form">
          <Title headingLevel="h2" size="xl" className="nb-bc-step-page-form__title">
            {t('ceph-storage-plugin~Tier 2 - Policy type')}
            <Button
              variant="link"
              icon={<MinusCircleIcon />}
              onClick={() => dispatch({ type: 'setPlacementPolicyTier2', value: null })}
              isInline
            >
              {t('ceph-storage-plugin~Remove Tier')}
            </Button>
          </Title>
          <Radio
            data-test="placement-policy-spread2"
            value={PlacementPolicy.Spread}
            isChecked={tier2Policy === PlacementPolicy.Spread}
            onChange={onChange}
            id="radio-3"
            label={t('ceph-storage-plugin~Spread')}
            name="placement-policy-2"
          />
          <p className="nb-create-bc-step-page-form__element--light-text">
            {t(
              'ceph-storage-plugin~Spreading the data across the chosen resources does not include failure tolerance in case of resource failure.',
            )}
          </p>
          <Radio
            data-test="placement-policy-mirror2"
            value={PlacementPolicy.Mirror}
            isChecked={tier2Policy === PlacementPolicy.Mirror}
            onChange={onChange}
            id="radio-4"
            label={t('ceph-storage-plugin~Mirror')}
            name="placement-policy-2"
          />
          <p className="nb-create-bc-step-page-form__element--light-text">
            {t(
              'ceph-storage-plugin~Full duplication of the data in each chosen resource includes failure tolerance in cause of resource failure.',
            )}
          </p>
        </Form>
      )}
    </div>
  );
};

export default PlacementPolicyPage;

type PlacementPolicyPageProps = {
  dispatch: React.Dispatch<Action>;
  state: State;
};
