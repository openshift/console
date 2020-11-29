import { QuickStart } from '../../../utils/quick-start-types';
import { ocsIcon } from './tour-icons';

export const ocsConfigurationQuickStart: QuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'ocs-configuration',
  },
  spec: {
    version: 4.7,
    displayName: `Openshift Container Storage Configuration`,
    durationMinutes: 5,
    // TODO change the icon to OCS
    icon: ocsIcon,
    description: `Learn how to configure OpenShift Container Storage to meet your deployment needs.`,
    prerequisites: [''],
    introduction: `In this tour you will learn about the various configurations available to customize your OpenShift Container Storage deployment.`,
    tasks: [
      {
        title: `Expand the OCS Storage Cluster`,
        description: `When we install the OCS operator we created a storage cluster, chose the cluster size, provisioned the underlying storage subsystem, deployed necessary drivers, and created the storage classes to allow the Openshift users to easily provision and consume storage services that have just been deployed
        
When the capacity of the cluster is about to run out we will notify you.

**To expand the OCS storage cluster follow these steps:**

1. Go to installed operators page and click on **Openshift Container Storage** 
2. Go to storage cluster tab
3. Click on the **3 dots icon** 
4. Click on add capacity
5. Use the expand cluster modal if your capacity is about to runout.
        `,
        review: {
          instructions: `#### Verify that you have expanded your storage cluster.  
          
Does the status of the installed operator show as Succeeded?`,
          failedTaskHelp: `This task isn’t verified yet. Try the task again.`,
        },
        summary: {
          success: `You have installed the Openshift Container Storage operator!`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: `Backing store & Bucket class`,
        description: `**Backing Store** 

Backing store is representing a storage target to be used as the underlying storage for the data in MCG buckets. These storage targets are used to store deduped+compressed+encrypted chunks of data (encryption keys are stored separately).

**To create a new Backing store:**

1. Go to installed operators page and click one Openshift Container Storage.
2. Go to backing store tab.
3. Click on **Create Backing Store**
4. Fill all required fields to finish creation process.

**Bucket class**

Bucket class policy determine the bucket's data location.
Data placement capabilities area built as a multi-tier structure, here are the Tiers bottom-up:

**Spread Tier** - list of backing-stores, aggregates the storage of multiple stores.

**Mirroring Tier** - list of spread-Tiers, async-mirroring to all mirros, with locality optimization.

**Create a new Bucket class:**
1. Go to installed operators page and click one Openshift Container Storage,
2. Go to bucket class tab.
3. Click on **Create Bucket Class**
4. Follow the wizard steps to  finish creation process.
`,
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
  },
};
