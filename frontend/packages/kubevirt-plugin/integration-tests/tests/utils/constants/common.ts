import { execSync } from 'child_process';

export const { STORAGE_CLASS = 'standard' } = process.env;

const rhelTinyCommonTemplateName = execSync(
  "kubectl get template -n openshift | grep rhel7-desktop-tiny | awk '{print $1}'",
).toString();

export const NOT_AVAILABLE = 'Not available';

// TIMEOUTS
export const SEC = 1000;
export const CLONE_VM_TIMEOUT_SECS = 720 * SEC;
export const CLONED_VM_BOOTUP_TIMEOUT_SECS = 300 * SEC;
export const PAGE_LOAD_TIMEOUT_SECS = 15 * SEC;
export const TEMPLATE_ACTIONS_TIMEOUT_SECS = 90 * SEC;
export const VM_ACTIONS_TIMEOUT_SECS = 250 * SEC;
export const VM_BOOTUP_TIMEOUT_SECS = 230 * SEC;
export const VM_MIGRATION_TIMEOUT_SECS = 260 * SEC;
export const VM_STOP_TIMEOUT_SECS = 20 * SEC;
export const VM_DELETE_TIMEOUT_SECS = 30 * SEC;
export const VM_IP_ASSIGNMENT_TIMEOUT_SECS = 180 * SEC;
export const VM_IMPORT_TIMEOUT_SECS = 160 * SEC;
export const WINDOWS_IMPORT_TIMEOUT_SECS = 150 * SEC;
export const VM_CREATE_AND_EDIT_TIMEOUT_SECS = 200 * SEC;
export const VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS = 15 * 60 * SEC;

export const POD_CREATION_TIMEOUT_SECS = 40 * SEC;
export const POD_TERMINATION_TIMEOUT_SECS = 30 * SEC;
export const POD_CREATE_DELETE_TIMEOUT_SECS =
  POD_CREATION_TIMEOUT_SECS + POD_TERMINATION_TIMEOUT_SECS;

export const NODE_STOP_MAINTENANCE_TIMEOUT = 40 * SEC;
export const JASMINE_EXTENDED_TIMEOUT_INTERVAL = 500 * SEC;

export const V2V_INSTANCE_CONNECTION_TIMEOUT = 30 * SEC;
export const V2V_VM_IMPORT_TIMEOUT = 3600 * SEC;

export const CDI_UPLOAD_TIMEOUT_SECS = 300 * SEC;

export const VIRTUALIZATION_TITLE = 'Virtualization';

// Wizard strings
export const IMPORT_WIZARD_CONN_TO_NEW_INSTANCE = 'Connect to New Instance';
export const NOT_RECOMMENDED_BUS_TYPE_WARN = 'Not recommended bus type';
// Some times we need to use existing VMWare instance, which name always starts from 'administrator'
export const IMPORT_WIZARD_CONN_NAME_PREFIX = 'administrator';
export const RHV_PROVIDER = 'Red Hat Virtualization (RHV)';
export const VMWARE_PROVIDER = 'VMware';

// Web-UI Exceptions
export const RHV_WIZARD_CREATE_SUCCESS = 'Started import of virtual machine';
export const WIZARD_CREATE_SUCCESS = 'Successfully created virtual machine';

// Framework Exception
export const UNEXPECTED_ACTION_ERROR = 'Received unexpected action.';

// Compute Nodes
export const NODE_MAINTENANCE_STATUS = 'Under maintenance';
export const NODE_STOPPING_MAINTENANCE_STATUS = 'Stopping maintenance';
export const NODE_READY_STATUS = 'Ready';

// Kubevirt related
export const KUBEVIRT_STORAGE_CLASS_DEFAULTS = 'kubevirt-storage-class-defaults';
export const KUBEVIRT_PROJECT_NAME = 'openshift-cnv';

export const commonTemplateVersion = () => rhelTinyCommonTemplateName.match(/v\d+\.\d+\.\d+/)[0];
export const INNER_TEMPLATE_VERSION = 'v0.11.0';

export const COMMON_TEMPLATES_NAMESPACE = 'openshift';
export const COMMON_TEMPLATES_REVISION = '1';

export const DEFAULT_YAML_VM_NAME = 'vm-example';

export const KUBEVIRT_SCRIPTS_PATH =
  './packages/kubevirt-plugin/integration-tests/tests/utils/scripts';
export const KUBEVIRT_TEMPLATES_PATH =
  './packages/kubevirt-plugin/integration-tests/tests/utils/templates';

export const CHARACTERS_NOT_ALLOWED = 'characters are not allowed';

export enum KEBAP_ACTION {
  Edit = 'Edit',
  Delete = 'Delete',
}
