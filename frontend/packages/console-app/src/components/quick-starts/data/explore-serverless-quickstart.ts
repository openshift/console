import { FLAG_KNATIVE_SERVING } from '@console/knative-plugin';
import { QuickStart } from '../utils/quick-start-types';
import { serverlessIcon } from './tour-icons';

export const exploreServerlessQuickStart: QuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'explore-serverless',
  },
  spec: {
    version: 4.7,
    displayName: `Setting up Serverless`,
    duration: 10,
    iconURL: serverlessIcon,
    description: `Install the OpenShift Serverless Operator to deploy stateless, event-trigger-based applications.`,
    prerequisites: '',
    introduction: `Red Hat® OpenShift® Serverless lets you run stateless, serverless workloads on a single multi-cloud container platform.

Serverless reduces the need to manage infrastructure or perform back-end development. Scaling is automated, and applications can run on any cloud, hybrid, or on-premises environment. Choosing Serverless means simplicity, portability, and efficiency.

Adding OpenShift Serverless to your OpenShift Container Platform cluster is quick and easy. This quick start walks you through the process.`,
    tasks: [
      {
        title: `Install the OpenShift Serverless Operator`,
        description: `### To install the Serverless Operator:
1. From the **Administrator** perspective, go to the **OperatorHub** from the **Operators** section of the navigation.
2. In the **Filter by keyword** field at the top of the page, type the keyword \`Serverless\`.
3. If the tile has an **Installed** label on it, the Operator is already installed. Proceed to task two.
4. Click the **OpenShift Serverless Operator** tile.
5. At the top of the OpenShift Serverless Operator panel, click **Install**.
6. Verify that the OpenShift Serverless Operator Update Channel is 4.5 and click **Install** again.
7. Wait for the OpenShift Serverless Operator's status to change from **Installing operator** to **Operator installed - Ready for use**.
`,

        review: {
          instructions: `#### To verify that the OpenShift Serverless Operator is installed:

In the Status column of the **Installed Operators** page, is the OpenShift Serverless Operator’s status **Succeeded?**`,
          taskHelp: `This task is incomplete. Try the task again, or [read more](https://docs.openshift.com/container-platform/4.6/serverless/installing_serverless/installing-openshift-serverless.html) about this topic.`,
        },

        recapitulation: {
          success: `You just installed the OpenShift Serverless Operator! Next, we'll install the required Knative Eventing and Knative Serving Custom Resource components for this Operator to run.`,
          failed: `This task is incomplete. Try the task again, or read more about this topic.`,
        },
      },
      {
        title: `Create the Knative Serving and Knative Eventing APIs`,
        description: `Now let’s install the Knative application programming interfaces (APIs) needed to deploy applications and container workloads.

**To create the Knative Serving and Knative Eventing APIs:**
1. Go to the **Installed Operators** page.
2. Click **OpenShift Serverless Operator**.
3. If it does not already exist, create a project called “knative_serving” under the Project list at the top of the page. If it does exist, select the project from the list.
4. Click on the Knative Serving link under Provided APIs or, from Knative Serving tile, click **Create Instance**.
5. Click **Create** to create the custom resource.
6. Now, if it does not already exist, create a project called “knative_eventing” under the Project list at the top of the page. If it does exist, select the project from the list.
7. Click on the Knative Eventing link under Provided APIs or, from Knative Eventing tile, click **Create Instance**.
8. Click **Create** to create the custom resource.
`,
        review: {
          instructions: `#### To verify that the Knative Serving and Knative Eventing APIs were installed successfully:
Go to the **All Instances** tab of the OpenShift Serverless Operator.

Are the Knative Serving and Knative Eventing resources in the list of instances?
`,
          taskHelp: `This task isn’t verified yet. Try the task again, or [read more](https://docs.openshift.com/container-platform/4.6/serverless/installing_serverless/installing-knative-serving.html#serverless-create-serving-project-web-console_installing-knative-serving) about this topic.`,
        },
        recapitulation: {
          success: `You just created instances of the Knative Service and Knative Eventing resources.`,
          failed: `Check your work to make sure that the Knative Service and Knative Eventing resources were created.`,
        },
      },
    ],
    conclusion: `Your Serverless Operator is ready! If you want to learn how to deploy a serverless application, take the **Creating a Serverless application** quick start.`,
    nextQuickStart: `serverless-application`,
    accessReviewResources: [
      {
        group: 'operators.coreos.com',
        resource: 'operatorgroups',
        verb: 'list',
      },
      {
        group: 'packages.operators.coreos.com',
        resource: 'packagemanifests',
        verb: 'list',
      },
    ],
    flags: {
      disallowed: [FLAG_KNATIVE_SERVING],
    },
  },
};
