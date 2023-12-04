import * as React from 'react';
import {
  Dropdown as DropdownDeprecated,
  DropdownItem as DropdownItemDeprecated,
  DropdownToggle as DropdownToggleDeprecated,
} from '@patternfly/react-core/deprecated';
import { TFunction } from 'i18next';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useLocation, Navigate } from 'react-router-dom-v5-compat';
import { withStartGuide } from '@console/internal/components/start-guide';
import { HorizontalNav, useAccessReview2 } from '@console/internal/components/utils';
import { useFlag } from '@console/shared/src/hooks/flag';
import { VMWizardMode, VMWizardName } from '../../constants';
import {
  VIRTUALMACHINES_BASE_URL,
  VIRTUALMACHINES_TEMPLATES_BASE_URL,
} from '../../constants/url-params';
import { FLAG_KUBEVIRT_HAS_PRINTABLESTATUS } from '../../flags/const';
import { VirtualMachineModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getVMWizardCreateLink } from '../../utils/url';
import MigrationTool from './migration-tool/MigrationTool';
import { VirtualMachinesPage } from './vm';
import { VirtualMachinesPage as NewVirtualMachinesPage } from './vm-page-new';
import './virtualization.scss';

export const RedirectToVirtualizationPage: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  return (
    <Navigate
      to={{
        pathname: params.ns
          ? `/k8s/ns/${params.ns}/${VIRTUALMACHINES_BASE_URL}`
          : `/k8s/all-namespaces/${VIRTUALMACHINES_BASE_URL}`,
        search: decodeURI(location.search),
      }}
      replace
    />
  );
};

export const RedirectToVirtualizationTemplatePage: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  return (
    <Navigate
      to={{
        pathname: params.ns
          ? `/k8s/ns/${params.ns}/${VIRTUALMACHINES_TEMPLATES_BASE_URL}`
          : `/k8s/all-namespaces/${VIRTUALMACHINES_TEMPLATES_BASE_URL}`,
        search: decodeURI(location.search),
      }}
      replace
    />
  );
};

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

export const WrappedVirtualizationPage: React.FC<VirtualizationPageProps> = (props) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(false);
  const printableVmStatusFlag = useFlag(FLAG_KUBEVIRT_HAS_PRINTABLESTATUS);
  const params = useParams();

  const namespace = params.ns;

  const [canCreate] = useAccessReview2({
    group: VirtualMachineModel?.apiGroup,
    resource: VirtualMachineModel?.plural,
    verb: 'create',
    namespace,
  });

  const obj = { loaded: true, data: { kind: kubevirtReferenceForModel(VirtualMachineModel) } };
  const pages = [
    {
      href: '',
      name: t('kubevirt-plugin~Virtual Machines'),
      component: printableVmStatusFlag ? NewVirtualMachinesPage : VirtualMachinesPage,
    },
  ];

  const getMenuItem = React.useCallback(
    ({ test, wizardName, mode, label }) => (
      <DropdownItemDeprecated
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
        <title>{t('kubevirt-plugin~Virtual Machines')}</title>
      </Helmet>
      <div className="co-m-nav-title">
        <h1 className="co-m-pane__heading" data-test-id="cluster-settings-page-heading">
          {t('kubevirt-plugin~Virtual Machines')}
          {canCreate && (
            <div className="co-actions" data-test-id="details-actions">
              <MigrationTool />
              <DropdownDeprecated
                data-test-id="item-create"
                onSelect={() => setOpen(false)}
                toggle={
                  <DropdownToggleDeprecated
                    onToggle={(_event, isExpanded) => setOpen(isExpanded)}
                    toggleVariant="primary"
                  >
                    {t('kubevirt-plugin~Create')}
                  </DropdownToggleDeprecated>
                }
                isOpen={isOpen}
                dropdownItems={[vmMenuItems(t).map(getMenuItem)]}
                isGrouped
                position="right"
              />
            </div>
          )}
        </h1>
      </div>
      <HorizontalNav
        {...props}
        pages={pages}
        obj={obj}
        hideNav
        customData={{ showTitle: false, noProjectsAvailable: props.noProjectsAvailable }}
      />
    </>
  );
};

type VirtualizationPageProps = {
  skipAccessReview?: boolean;
  noProjectsAvailable?: boolean;
  location?: { search?: string };
};

const VirtualizationPage = withStartGuide(WrappedVirtualizationPage);

export { VirtualizationPage };
