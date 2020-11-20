import * as React from 'react';
import { Link, Redirect, RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownToggle,
  DropdownPosition,
  DropdownSeparator,
} from '@patternfly/react-core';
import { withStartGuide } from '@console/internal/components/start-guide';
import { checkAccess, HorizontalNav } from '@console/internal/components/utils';
import { FLAGS } from '@console/shared';
import { ConfigMapModel } from '@console/internal/models';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useSafetyFirst } from '@console/internal/components/safety-first';

import { VirtualMachinesPage } from './vm';
import { VirtualMachineTemplatesPage } from '../vm-templates/vm-template';
import { VirtualMachineModel } from '../../models';
import { VMWizardActionLabels, VMWizardMode, VMWizardName } from '../../constants';
import { getVMWizardCreateLink } from '../../utils/url';
import {
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME,
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES,
} from '../../constants/v2v';

import './virtualization.scss';

export const RedirectToVirtualizationPage: React.FC<RouteComponentProps<{ ns: string }>> = (
  props,
) => (
  <Redirect
    to={{
      pathname: props.match.params.ns
        ? `/k8s/ns/${props.match.params.ns}/virtualization`
        : `/k8s/all-namespaces/virtualization`,
      search: decodeURI(props.location.search),
    }}
  />
);

export const RedirectToVirtualizationTemplatePage: React.FC<RouteComponentProps<{ ns: string }>> = (
  props,
) => (
  <Redirect
    to={{
      pathname: props.match.params.ns
        ? `/k8s/ns/${props.match.params.ns}/virtualization/templates`
        : `/k8s/all-namespaces/virtualization/templates`,
      search: decodeURI(props.location.search),
    }}
  />
);

const title = 'Virtualization';

const vmMenuItems = [
  {
    test: 'vm-wizard',
    wizardName: VMWizardName.BASIC,
    mode: VMWizardMode.VM,
    label: VMWizardActionLabels.WIZARD,
  },
  {
    test: 'vm-yaml',
    wizardName: VMWizardName.YAML,
    mode: VMWizardMode.VM,
    label: VMWizardActionLabels.YAML,
  },
];

const importMenuItems = [
  {
    test: 'vm-import',
    wizardName: VMWizardName.WIZARD,
    mode: VMWizardMode.IMPORT,
    label: VMWizardActionLabels.IMPORT,
  },
];

const templateMenuItems = [
  {
    test: 'template-wizard',
    wizardName: VMWizardName.WIZARD,
    mode: VMWizardMode.TEMPLATE,
    label: VMWizardActionLabels.WIZARD,
  },
  {
    test: 'template-yaml',
    wizardName: VMWizardName.YAML,
    mode: VMWizardMode.TEMPLATE,
    label: VMWizardActionLabels.YAML,
  },
];

export const WrappedVirtualizationPage: React.FC<VirtualizationPageProps> = (props) => {
  const [isOpen, setOpen] = React.useState(false);
  const [importAllowed, setImportAllowed] = useSafetyFirst(false);
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);

  React.useEffect(() => {
    VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES.forEach((configMapNamespace) => {
      checkAccess({
        group: ConfigMapModel.apiGroup,
        verb: 'get',
        resource: ConfigMapModel.plural,
        name: VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME,
        namespace: configMapNamespace,
      })
        .then((result) => {
          if (result?.status?.allowed) {
            setImportAllowed(true);
          }
        })
        // Default to enabling the action if the access review fails so that we
        // don't incorrectly block users from actions they can perform. The server
        // still enforces access control.
        .catch(() => setImportAllowed(true));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const namespace = props.match.params.ns;

  const obj = { loaded: true, data: { kind: VirtualMachineModel.kind } };
  const pages = [
    {
      href: '',
      name: 'Virtual Machines',
      component: VirtualMachinesPage,
    },
  ];

  if (openshiftFlag) {
    pages.push({
      href: 'templates',
      name: 'Templates',
      component: VirtualMachineTemplatesPage,
    });
  }

  const getMenuItem = React.useCallback(
    ({ test, wizardName, mode, label }) => (
      <DropdownItem
        key={label}
        component={
          <Link
            data-test-id={test}
            to={getVMWizardCreateLink({
              namespace,
              wizardName,
              mode,
            })}
          >
            {label}
          </Link>
        }
      />
    ),
    [namespace],
  );

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--row">
        <h1 className="co-m-pane__heading" data-test-id="cluster-settings-page-heading">
          {title}
        </h1>
        <div className="co-actions" data-test-id="details-actions">
          <Dropdown
            data-test-id="item-create"
            onSelect={() => setOpen(false)}
            toggle={
              <DropdownToggle onToggle={setOpen} isPrimary>
                Create
              </DropdownToggle>
            }
            isOpen={isOpen}
            dropdownItems={[
              <DropdownGroup className="kv-dropdown-group" label="Virtual machine" key="vm">
                {[...vmMenuItems, ...(importAllowed ? importMenuItems : [])].map(getMenuItem)}
              </DropdownGroup>,
              <DropdownGroup
                className="kv-dropdown-group kv-dropdown-group--separator"
                key="separator"
              >
                <DropdownSeparator />
              </DropdownGroup>,
              <DropdownGroup className="kv-dropdown-group" label="Template" key="vm-template">
                {templateMenuItems.map(getMenuItem)}
              </DropdownGroup>,
            ]}
            isGrouped
            position={DropdownPosition.right}
          />
        </div>
      </div>
      <HorizontalNav
        {...props}
        pages={pages}
        match={props.match}
        obj={obj}
        customData={{ showTitle: false, noProjectsAvailable: props.noProjectsAvailable }}
      />
    </>
  );
};

type VirtualizationPageProps = {
  match: any;
  skipAccessReview?: boolean;
  noProjectsAvailable?: boolean;
  location?: { search?: string };
};

const VirtualizationPage = withStartGuide(WrappedVirtualizationPage);

export { VirtualizationPage };
