export const explorePipelinesQuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'QuickStarts',
  metadata: {
    name: 'explore-pipelines',
  },
  spec: {
    version: 4.7,
    displayName: `Explore Pipelines`,
    duration: 10,
    iconURL:
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-marketplace/packagemanifests/openshift-pipelines-operator/icon?resourceVersion=openshift-pipelines-operator.dev-preview.openshift-pipelines-operator.v0.10.7',
    description:
      'Install the OpenShift® Pipelines Operator to start building pipelines using Tekton',
    prerequisites: 'User must have access to install operators to run this Quick Start.',
    introduction: `### In this tour, you will complete 3 tasks:
1. Create an application from git.
2. Explore your application in topology.
3. Explore your pipeline run.`,
    tasks: [
      {
        title: `Create an application from git`,
        description: `### Follow these steps to create an application:
1. In the **</> Developer perspective**, click to the **+Add** page.
2. Create a new project
3. Click **Import from Git** to create an application, specifying [https://github.com/sclorg/django-ex.git](https://github.com/sclorg/django-ex.git) as the Git Repo URL.
4. In the **Pipelines** section, click the checkbox to add a pipeline to your application.
5. Click **Create** when you’re done.`,
        review: {
          instructions: `#### To verify that the Pipelines Operator was successfully installed:
1. Go to the Installed Operators page from the Operators section of the navigation.
2. Check if OpenShift Pipelines Operator appears in the list.
3. Check the status of the Operator.
4. Momentarily, the status should become Succeeded.

Is the status Succeeded?`,
          taskHelp: 'Try walking through the steps again to properly install Pipelines Operator',
        },
        recapitulation: {
          success: `You've just installed the Pipelines Operator!`,
          failed: 'Check your work to make sure that ',
        },
      },
      {
        title: 'Explore your application in topology',
        description: `#### To install the Pipelines Operator:
1. In the Administrator perspective, go to the OperatorHub from the Operators section of the navigation.
2. Use the filter at the top of the page to search for the OpenShift® Pipelines Operator.
3. If the card has an Installed label on it, the Operator has already been installed.  You won't be able to perform the following steps, and should cancel out of the Quick Start.
4. Click on the card to open the Operator details.
5. At the top of the side panel, click Install.
6. Fill out the Operator Subscription form, choose the channel matching your OpenShift cluster, and click Install. You can leave all of the prefilled options if you’d like.
7. After a few minutes, the OpenShift® Pipelines Operator should appear in your Installed Operators list.
8. Click it to see its details.`,
        review: {
          instructions: `#### To verify that the Pipelines Operator was successfully installed:
1. Go to the Installed Operators page from the Operators section of the navigation.
2. Check if OpenShift Pipelines Operator appears in the list.
3. Check the status of the Operator.
4. Momentarily, the status should become Succeeded.

Is the status Succeeded?`,
          taskHelp: 'Try walking through the steps again to properly install Pipelines Operator',
        },
        recapitulation: {
          success: "You've just installed the Pipelines Operator!",
          failed: 'Check your work to make sure that ',
        },
      },
      {
        title: `Explore your pipeline run`,
        description: `#### To install the Pipelines Operator:
1. In the Administrator perspective, go to the OperatorHub from the Operators section of the navigation.
2. Use the filter at the top of the page to search for the OpenShift® Pipelines Operator.
3. If the card has an Installed label on it, the Operator has already been installed.  You won't be able to perform the following steps, and should cancel out of the Quick Start
4. Click on the card to open the Operator details.
5. At the top of the side panel, click Install.
6. Fill out the Operator Subscription form, choose the channel matching your OpenShift cluster, and click Install. You can leave all of the prefilled options if you’d like.
7. After a few minutes, the OpenShift® Pipelines Operator should appear in your Installed Operators list.
8. Click it to see its details.`,
        review: {
          instructions: `#### To verify that the Pipelines Operator was successfully installed:
1. Go to the Installed Operators page from the Operators section of the navigation.
2. Check if OpenShift Pipelines Operator appears in the list.
3. Check the status of the Operator.\n  4. Momentarily, the status should become Succeeded.

Is the status Succeeded?`,
          taskHelp: 'Try walking through the steps again to properly install Pipelines Operator.',
        },
        recapitulation: {
          success: "You've just installed the Pipelines Operator!",
          failed: 'Check your work to make sure that Pipelines Operator is installed properly.',
        },
      },
    ],
    conclusion:
      'Your Pipelines Operator is installed and ready! If you want to learn how to deploy an application and associate a pipeline with it, take the Install application and associate pipeline Quick Start.',
    nextQuickStart: 'install-app-and-associate-pipeline',
  },
};
