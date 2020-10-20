import { OCS_FLAG } from '@console/ceph-storage-plugin/src/features';

const GetStartedWithOCS = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'getting-started-ocs',
  },
  spec: {
    version: 4.7,
    displayName: `Getting started with Openshift Container Storage`,
    duration: 5,
    iconURL: '',
    description: `Explore the OCS Service to understand how to better manage your storage across platforms.`,
    prerequisites: '',
    introduction: `TBD`,
    tasks: [
      {
        title: `Deploying applications with persistent volumes`,
        description: `**Example:** deploying a MYSQL or WordPress app. Both MySQL and Wordpress require a PersistentVolume to store data.

OpenShift Container Storage uses the Kubernetes persistent volume (PV) framework to allow cluster 
administrators to provision persistent storage for a cluster. Developers can use persistent volume
claims (PVCs) to request PV resources without having specific knowledge of the underlying storage infrastructure.
PV/PVC are independent from Pod lifecycles and preserve data through restarting, rescheduling, and even deleting Pods.

**Connect your application with a PVC**: 
1. Click the ":" For the MySQL application.
2. Click on **Add Storage**
3. To Create a new PVC Click on **Create new claim**
4. Choose one of the OCS storage classes to allow OCS to manage this PVC.
5. Fill all required fields to finish Add Storage process.`,
        recapitulation: {
          success: `Congratulations, **my-storage** PVC is now attached to your application.`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: 'Connecting application to object storage',
        description: `OCS is providing a single object service experience across the platform, flattening the learning curve and providing
an easy way to consume it. Like any object  service, we need access key, secret key, and endpoint to connect, OB/OBC 
is an easy way to make the service accessible to applications.

**Connect your application with an OBC**: 
1. Create an OBC. Click on Create Object Bucket Claim.
2. Storage class selection - Choose the OCS storage class for object storage.
3. Bucket class selection - when selecting a bucket class we determine where data is located. Choose one OCS bucket class.
4. Click on the **Actions** dropdown and select **Attach to Deployment**
5. Select the application you wish to attach to the OBC and click **Attach**`,
        recapitulation: {
          success: `Congratulations, the **test** OBC is now attached to your application`,
          failed: `Try the steps again.`,
        },
      },
      {
        title: 'Explore the OCS Service monitoring dashboards',
        description: `The OCS monitoring dashboard allows you to monitor all the storage resources that OCS manages.
It can be either persistent or object storage.

Click **Home** -> **Overview** to reach the main dashboard. You will see two additional tabs named **Persistent Storage** and **Object Storage**.

In the OCS dashboards you'll see:

**Status** - The status of your persistent/object storage, and relevant alerts if something is off and needs your attention.
**Inventory** - Your storage resources inventory.
**Capacity breakdown** - you can breakdown capacity by breakdown consumers.
**Performance** - allows you to see different metrices or each storage type.
**Activity** - all important activities that goes on with OCS related resources are listed in this card.

**Lets start some exploration**:
1. Click on the persistent storage status to get more information.
2. Click on the dropdown in the capacity breakdown card and change the focus to break by **Project**.
`,
        recapitulation: {
          success: 'We finished exploring the OCS dashboards',
        },
      },
    ],
    conclusion: `We finished exploring the OCS. From now on make sure you are using the OCS storage classes to let us take care 
    of storage management for you.`,
    flags: {
      required: [OCS_FLAG],
    },
  },
};

export default GetStartedWithOCS;
