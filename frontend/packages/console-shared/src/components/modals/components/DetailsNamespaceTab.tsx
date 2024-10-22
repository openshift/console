import * as React from 'react';
import {
  Button,
  Popover,
  Select,
  SelectList,
  MenuToggle,
  MenuToggleElement,
  SelectOption,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { SelectorInput } from '@console/internal/components/utils';
import { allow, deny } from '../constants';

type DetailsNamespaceTabProps = {
  networkPolicy: string;
  name: string;
  labels: any[];
  setNetworkPolicy: React.Dispatch<React.SetStateAction<string>>;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setLabels: React.Dispatch<React.SetStateAction<any[]>>;
};

const DetailsNamespaceTab: React.FC<DetailsNamespaceTabProps> = ({
  name,
  labels,
  setNetworkPolicy,
  setName,
  setLabels,
}) => {
  const { t } = useTranslation();

  const defaultNetworkPolicies = [
    {
      key: 'allow',
      value: t('console-shared~No restrictions'),
    },
    {
      key: 'deny',
      value: t('console-shared~Deny all inbound traffic'),
    },
  ];

  const selectOptions = defaultNetworkPolicies.map((option) => (
    <SelectOption key={option.key} value={option.value}>
      {option.value}
    </SelectOption>
  ));

  const [isOpen, setIsOpen] = React.useState(false);
  const defaultNetworkPolicy = defaultNetworkPolicies[0].value;
  const [selected, setSelected] = React.useState<string>(defaultNetworkPolicy);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    setIsOpen(!isOpen);
    setSelected(value as string);
    if (value === defaultNetworkPolicy) {
      setNetworkPolicy(allow);
    } else {
      setNetworkPolicy(deny);
    }
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen}>
      {selected}
    </MenuToggle>
  );

  const popoverText = () => {
    const nameFormat = t(
      "console-shared~A Namespace name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name' or '123-abc').",
    );
    const createNamespaceText = t(
      "console-shared~You must create a Namespace to be able to create projects that begin with 'openshift-', 'kubernetes-', or 'kube-'.",
    );
    return (
      <>
        <p>{nameFormat}</p>
        <p>{createNamespaceText}</p>
      </>
    );
  };

  return (
    <>
      <div className="form-group">
        <label htmlFor="input-name" className="control-label co-required">
          {t('console-shared~Name')}
        </label>{' '}
        <Popover aria-label={t('console-shared~Naming information')} bodyContent={popoverText}>
          <Button
            className="co-button-help-icon"
            variant="plain"
            aria-label={t('console-shared~View naming information')}
          >
            <OutlinedQuestionCircleIcon />
          </Button>
        </Popover>
        <div className="modal-body__field">
          <input
            id="input-name"
            data-test="input-name"
            name="name"
            type="text"
            className="pf-v5-c-form-control"
            onChange={(e) => setName(e.target.value)}
            value={name || ''}
            required
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="tags-input" className="control-label">
          {t('console-shared~Labels')}
        </label>
        <div className="modal-body__field">
          <SelectorInput
            labelClassName="co-m-namespace"
            onChange={(value) => setLabels(value)}
            tags={labels}
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="network-policy" className="control-label">
          {t('console-shared~Default network policy')}
        </label>
        <div className="modal-body__field ">
          <Select
            id="dropdown-selectbox"
            isOpen={isOpen}
            selected={selected}
            onSelect={onSelect}
            onOpenChange={() => setIsOpen(isOpen)}
            toggle={toggle}
            shouldFocusToggleOnSelect
          >
            <SelectList>{selectOptions}</SelectList>
          </Select>
        </div>
      </div>
    </>
  );
};

export default DetailsNamespaceTab;
