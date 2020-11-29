import { QuickStart } from '../../../utils/quick-start-types';
import { ocsIcon } from './tour-icons';

export const ocsInstallTourQuickStart: QuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'ConsoleQuickStarts',
  metadata: {
    name: 'ocs-install-tour',
  },
  spec: {
    version: 4.7,
    displayName: `Installing Openshift Container Storage`,
    durationMinutes: 5,
    // TODO change the icon to OCS
    icon: ocsIcon,
    description: `Install the OCS operator and create a storage cluster to have the OCS service up and running`,
    introduction: `Red Hat OpenShift Container Storage is persistent software-defined storage integrated with and optimized for Red Hat OpenShift Container Platform. Dynamic, stateful, and highly available container-native storage can be provisioned and de-provisioned on demand as an integral part of the OpenShift administrator console. Portability Offers easy cross-cloud data placement and access, along with hybrid and multicloud data protection for enterprise applications. Consistent OpenShift management tools work across clouds, whether on-premise or public. Simplicity Fully integrates with Red Hat OpenShift Container Platform for Day 1 and Day 2 installation and management. supports: for Block, Filesystem and Object storage Scalability Supports for OpenShift workloads, allowing easy data sharing across geographic locations and platforms, and scales to orders of magnitude more persistent volumes (PVs) per OpenShift Container Storage cluster.`,
    tasks: [
      {
        title: `Installing the OpenShift Container Storage`,
        description: `The OperatorHub is where you can find a catalog of available Operators to install on your cluster.
        
Follow these steps to Install OpenShift Container Storage

1. Visit the OperatorHub and search for the Openshift container storage operator.
2. Click on the operator option to initiate the operator installation on your cluster.
3. Click install when you're finished with Operator Subscription form.
4. When installation is finished click **Create Storage Cluster**.`,
        review: {
          instructions: `#### Verify that the OpenShift Container Storage operator is installed.  
          
Does the status of the installed operator show as Succeeded?`,
          failedTaskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        summary: {
          success: `You have installed the Openshift Container Storage operator!`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: `Create a storage cluster`,
        description: `A storage cluster includes a Ceph cluster, Multi cloud gateway and all the storage and commute resources required.
        
Follow these steps to create a storage cluster

1. Select the cluster mode
    - **Internal** (For cloud deployments)
    - **Internal-Attached device** (For bare metal or attached devices deployments)
    - **External** (For external RHCS Cluster)
2. Follow the instructions on the page to create the storage cluster.
3. Once the storage cluster is created you can start using the openshift container storage resources (storage classes and the bucket classes) to allow OCS to manage your storage.`,
        review: {
          instructions: `#### Verify that the Storage Cluster is created.  

Does the status of the storage cluster show a ready state?`,
          failedTaskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        summary: {
          success: `You have installed the Openshift Container Storage operator!`,
          failed: `Try the steps again.`,
        },
      },
    ],
    conclusion: `Congrats, the Openshift Container Storage operator is ready to use. To learn how you can manage the storage space effectively, take the Getting Started Openshift Container Storage quick start`,
    nextQuickStart: [`getting-started-ocs`],
  },
};
