@topology
Feature: Editing an application
              As a user, I want to edit an application

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-edit-node-resource"
              And user is at Add page


        @smoke
        Scenario Outline: Editing a workload: T-09-TC01
            Given user has created workload "<workload_name>" with resource type "<resource_type>"
             When user right clicks on the workload "<workload_name>" to open the Context Menu
              And user clicks on "Edit <workload_name>" from context action menu
              And user edits application groupings to "<application_groupings>"
              And user saves the changes
             Then user can see application groupings updated to "<application_groupings>"

        Examples:
                  | resource_type     | workload_name   | application_groupings |
                  | Deployment        | nodejs-ex-git   | app1                  |
                  | Deployment Config | dancer-ex-git-1 | app2                  |


        @smoke
        Scenario: Editing a knative service: T-09-TC02
            Given user has installed OpenShift Serverless Operator
              And user is at Add page
              And user has created or selected namespace "aut-topology-edit-resource"
              And user has created workload "nodejs-ex-git-kn" with resource type "Knative Service"
             When user right clicks on the workload "nodejs-ex-git-kn" to open the Context Menu
              And user clicks on "Edit nodejs-ex-git-kn" from context action menu
              And user edits application groupings to "new-app"
              And user saves the changes
             Then user can see application groupings updated to "new-app"


        @smoke
        Scenario: Advanced image options in Edit deployment/deployment config form: T-09-TC03
            Given user has created workload "nodejs-advanced" with resource type "Deployment"
             When user right clicks on the workload "nodejs-advanced" to open the Context Menu
              And user clicks "Edit Deployment" from action menu
              And user clicks on Show advanced image options
              And user clicks on Create new secret
              And user creates a new secret "new-secret"
             Then user will see "new-secret" in secret name dropdown under Pull secret


        @smoke
        Scenario: Editing deployment resource limits through form view: T-09-TC04
            Given user has created workload "resource-limit" with resource type "Deployment Config"
             When user right clicks on the workload "resource-limit" to open the Context Menu
              And user clicks "Edit resource limits" from action menu
              And user enters value of CPU Request as "250"
              And user enters value of CPU Limit as "500"
              And user enters value of Memory Request as "64"
              And user enters value of Memory Limit as "128"
              And user clicks on Save
             Then user will be redirected to Topology with the updated resource limits


        @smoke
        Scenario: Editing deployment using form view: T-09-TC05
            Given user has created workload "rolling-update" with resource type "Deployment"
             When user right clicks on the workload "rolling-update" to open the Context Menu
              And user clicks "Edit Deployment" from action menu
              And user selects "Rolling Update" Strategy type under Deployment Strategy
              And user enters value of Maximum number of unavailable Pods and Maximum number of surge Pods as "25%"
              And user selects value of project, image stream and tag section under images as "openshift", "golang" and "latest" respectively
              And user enters NAME as "DEMO_GREETING" and VALUE as "Hello from the environment"
              And user clicks on Show advanced image options
              And user clicks on Create new secret
              And user creates a new secret "new-secret1"
              And user selects secret "new-secret1" from Pull secret dropdown
              And user selects the Pause rollouts check box under advanced options section
              And user saves the changes
             Then user will be redirected to Topology with the updated deployment


        @smoke
        Scenario Outline: Editing deployment config using form view: T-09-TC06
            Given user has created workload "recreate-update" with resource type "Deployment Config"
             When user right clicks on the workload "recreate-update" to open the Context Menu
              And user clicks "Edit DeploymentConfig" from action menu
              And user selects "Recreate" Strategy type under Deployment Strategy
              And user enters Timeout value as "600"
              And user clicks on Show additional parameters and lifcycle hooks
              And user adds Pre Cycle Hook for workload "recreate-update" with failure policy "Abort"
              And user adds Mid Cycle Hook for workload "recreate-update" with failure policy "Retry"
              And user adds Post Cycle Hook for workload "recreate-update" with failure policy "Ignore"
              And user unchecks Deploy image from an image stream tag checkbox
              And user enters value of Image name as "<image_value>"
              And user saves the changes
             Then user will be redirected to Topology with the updated deployment

        Examples:
                  | image_value                                                                                                            |
                  | quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:51435011b4f381e292cd70c231d45a35add8b2d28ccac707c52802c143604630 |


        @regression @manual
        Scenario: Edit JAR file through drag and drop: T-09-TC07
            Given user has uploaded JAR file
             When user opens sidebar of the file
              And user clicks on Edit app in Action menu
              And user drag and drop a new JAR file in JAR file section
              And user updates Build image version
              And user clicks on Save
             Then user is redirected to topology
              And user can see a toast notification of JAR file uploading with link to build logs


        @regression @manual
        Scenario: Additional parameters and lifecycle hooks for Edit deployment config: T-09-TC08
            Given user is on Edit DeploymentConfig page
             When user clicks on "Show additional parameters and lifecycle hooks" option
              And user clicks on "Add Pre Cycle Hook" under Pre Cycle Hook section
              And user clicks on "Add Mid Cycle Hook" under Mid Cycle Hook section
              And user clicks on "Add Post Cycle Hook" under Post Cycle Hook section
             Then user will see "Lifecycle action", "Container name", "Command", "Environment variables(runtime only)" "Volumes" and "Failure policy" sections in each of the form
              And user will see Tick and cross buttons associated with the forms


        @regression @manual
        Scenario Outline: Advanced container options in Edit deployment/deployment config form: T-09-TC09
            Given user has "<resource>" workload "workload-d"
              And user is on Edit "<resource>" page
             When user selects "Deploy image from an image stream tag" checkbox
              And user clicks on "Show advanced container options" option
             Then user will see "Environment variables(runtime only)" under Environment variables for container mentioned in image stream section
              And user will see "Add value" and "Add from ConfigMap or Secret" options

        Examples:
                  | resource         |
                  | Deployment       |
                  | DeploymentConfig |


        @regression @manual
        Scenario Outline: Additional advanced sections in Edit deployment/deployment config form: T-09-TC10
            Given user has "<resource>" workload "workload-d"
              And user is on Edit "<resource>" page
             When user clicks on "Pause rollouts" in advanced options
              And user clicks on "Scaling" option
             Then user will see "Pause rollouts for this <value>" checkbox under Pause rollouts section
              And user will see "Replicas" in Scaling section

        Examples:
                  | resource         | value             |
                  | Deployment       | deployment        |
                  | DeploymentConfig | deployment config |
