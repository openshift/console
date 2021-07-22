import * as React from 'react';
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownPosition,
  DropdownSeparator,
  DropdownToggle,
} from '@patternfly/react-core';
import { TFunction } from 'i18next';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link, Redirect, RouteComponentProps } from 'react-router-dom';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { withStartGuide } from '@console/internal/components/start-guide';
import { checkAccess, HorizontalNav } from '@console/internal/components/utils';
import { ConfigMapModel } from '@console/internal/models';
import { FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { VMWizardMode, VMWizardName } from '../../constants';
import {
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME,
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES,
} from '../../constants/v2v';
import { VirtualMachineModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getVMWizardCreateLink } from '../../utils/url';
import { VirtualMachineTemplatesPage } from '../vm-templates/vm-template';
import MigrationTool from './migration-tool/MigrationTool';
import { VirtualMachinesPage } from './vm';

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

const vmMenuItems = (t: TFunction) => [
  {
    test: 'vm-wizard',
    wizardName: VMWizardName.BASIC,
    mode: VMWizardMode.VM,
    label: t('kubevirt-plugin~With Wizard'),
  },
  {
    test: 'vm-yaml',
    wizardName: VMWizardName.YAML,
    mode: VMWizardMode.VM,
    label: t('kubevirt-plugin~With YAML'),
  },
];

const importMenuItems = (t: TFunction) => [
  {
    test: 'vm-import',
    wizardName: VMWizardName.WIZARD,
    mode: VMWizardMode.IMPORT,
    label: t('kubevirt-plugin~With Import wizard'),
  },
];

const templateMenuItems = (t: TFunction) => [
  {
    test: 'template-wizard',
    wizardName: VMWizardName.WIZARD,
    mode: VMWizardMode.TEMPLATE,
    label: t('kubevirt-plugin~With Wizard'),
  },
  {
    test: 'template-yaml',
    wizardName: VMWizardName.YAML,
    mode: VMWizardMode.TEMPLATE,
    label: t('kubevirt-plugin~With YAML'),
  },
];

export const WrappedVirtualizationPage: React.FC<VirtualizationPageProps> = (props) => {
  const { t } = useTranslation();
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

  const obj = { loaded: true, data: { kind: kubevirtReferenceForModel(VirtualMachineModel) } };
  const pages = [
    {
      href: '',
      name: t('kubevirt-plugin~Virtual Machines'),
      component: VirtualMachinesPage,
    },
  ];

  if (openshiftFlag) {
    pages.push({
      href: 'templates',
      name: t('kubevirt-plugin~Templates'),
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
        <title>{t('kubevirt-plugin~Virtualization')}</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--row">
        <h1 className="co-m-pane__heading" data-test-id="cluster-settings-page-heading">
          {t('kubevirt-plugin~Virtualization')}
        </h1>
        <div className="co-actions" data-test-id="details-actions">
          <MigrationTool />
          <Dropdown
            data-test-id="item-create"
            onSelect={() => setOpen(false)}
            toggle={
              <DropdownToggle onToggle={setOpen} isPrimary>
                {t('kubevirt-plugin~Create')}
              </DropdownToggle>
            }
            isOpen={isOpen}
            dropdownItems={[
              <DropdownGroup
                className="kv-dropdown-group"
                label={t('kubevirt-plugin~Virtual Machine')}
                key="vm"
              >
                {[...vmMenuItems(t), ...(importAllowed ? importMenuItems(t) : [])].map(getMenuItem)}
              </DropdownGroup>,
              <DropdownGroup
                className="kv-dropdown-group kv-dropdown-group--separator"
                key="separator"
              >
                <DropdownSeparator />
              </DropdownGroup>,
              <DropdownGroup
                className="kv-dropdown-group"
                label={t('kubevirt-plugin~Template')}
                key="vm-template"
              >
                {templateMenuItems(t).map(getMenuItem)}
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
