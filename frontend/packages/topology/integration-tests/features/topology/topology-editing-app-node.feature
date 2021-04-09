@topology
Feature: Editing an application
              As a user, I want to edit an application

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-editing-app-node"


        @smoke
        Scenario Outline: Editing a workload : T-06-TC14, T-06-TC15
            Given user has created workload "<workload_name>"  with resource type "<resource_type>"
              And user is at the Topology page
             When user right clicks on the node "<workload_name>" to open context menu
              And user selects option "Edit <workload_name>" from context menu
              And user can see Edit form
              And user verifies that name of the node and route option is not editable
              And user verifies that Application grouping, git url, builder image version and advanced option can be edited
              And user edits Application name as "nodejs-ex-git-app-1"
              And user clicks on save
             Then user can see the change of node to the new Application "nodejs-ex-git-app-1"

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git   |
                  | deployment config | dancer-ex-git-1 |


        @regression
        Scenario: Editing a knative service : T-06-TC14, T-06-TC15
            Given user has created knative workload "nodejs-ex-git"
              And user is at the Topology page
             When user right clicks on the node "nodejs-ex-git" to open context menu
              And user selects option "Edit Service" from context menu
              And user can see Edit form
              And user verifies that name of service and route option is not editable
              And user verifies that Application grouping, git url, builder image version and advanced option can be edited
              And user edits Application name as "nodejs-ex-git-app-1"
              And user clicks on save
             Then user can see the change of knative service to the new Application defined above


        @regression @manual
        Scenario: Edit JAR file through drag and drop
            Given user has uploaded JAR file
             When user opens sidebar of the file
              And user clicks on Edit app in Action menu
              And user drag and drop a new JAR file in JAR file section
              And user updates Build image version
              And user clicks on Save
             Then user is redirected to topology
              And user can see a toast notification of JAR file uploading with link to build logs


        @regression @manual
        Scenario: Edit form for deployment
            Given user has created deployment workload
              And user is at the Topology page
             When user right clicks on the node to open context menu
              And user selects option "Edit Deployment" from context menu
             Then user will see option to switch between YAML view and Form view
              And user will see Recreate Strategy type under Deployment Strategy selected by default
              And user will see "Maximum number of unavailable Pods" and "Maximum number of surge Pods" sections for Strategy type RollingUpdate under Deployment Strategy
              And user will see "Deploy image from an image stream tag" checkbox under Images with project, image stream and tag section associated with it
              And user will see Image name section under Images with checkbox "Deploy image from an image stream tag" unchecked
              And user will see "Show advanced image options" and "Show advanced container options" in case of image stream option
              And user will see advanced option for "Pause rollouts" and "Scaling"


        @regression @manual
        Scenario: Edit form for deployment config
            Given user has created deployment config workload
              And user is at the Topology page
             When user right clicks on the node to open context menu
              And user selects option "Edit DeploymentConfig" from context menu
             Then user will see option to switch between YAML view and Form view
              And user will see "Timeout" section assciated with Recreate Strategy type under Deployment Strategy selected by default
              And user will see "Timeout", "Maximum number of unavailable Pods" and "Maximum number of surge Pods" sections for Strategy type RollingUpdate under Deployment Strategy
              And user will see "Image name", "Command" and "Environment variables(runtime only)" sections for Strategy type Custom under Deployment Strategy
              And user will see "Deploy image from an image stream tag" checkbox under Images with project, image stream and tag section associated with it
              And user will see Image name section under Images with checkbox "Deploy image from an image stream tag" unchecked
              And user will see "Show additional parameters and lifecycle hooks", "Show advanced image options" and "Show advanced container options" in case of image stream option
              And user will see advanced option for "Pause rollouts" and "Scaling"


        @regression @manual
        Scenario: Additional parameters and lifecycle hooks for Edit deployment config
            Given user is on Edit DeploymentConfig page
             When user clicks on "Show additional parameters and lifecycle hooks" option
              And user clicks on "Add Pre Cycle Hook" under Pre Cycle Hook section
              And user clicks on "Add Mid Cycle Hook" under Mid Cycle Hook section
              And user clicks on "Add Post Cycle Hook" under Post Cycle Hook section
             Then user will see "Lifecycle action", "Container name", "Command", "Environment variables(runtime only)" "Volumes" and "Failure policy" sections in each of the form
              And user will see Tick and cross buttons associated with the forms


        @regression @manual
        Scenario Outline: Advanced container options in Edit deployment/deployment config form
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


        @regression @to-do
        Scenario Outline: Advanced image options in Edit deployment/deployment config form
            Given user has "<resource>" workload "workload-d"
              And user is on Edit "<resource>" page
             When user clicks on "Show advanced image options" option
              And user clicks on Create new secret
              And user enters Secret name as "new-secret1"
              And user selects Authentication type as "Image registry credentiials"
              And user enters Image registry server address as "https://quay.io/repository/kubernetes-ingress-controller/nginx-ingress-controller?tag=latest&tab=tags"
              And user enters Username and Password as "test1" and "test" respectively
              And user enters Email as "test1@redhat.com"
              And user clicks on Create button
             Then user will see "new-secret1" in secret name dropdown under Pull secret

        Examples:
                  | resource         |
                  | Deployment       |
                  | DeploymentConfig |


        @regression @manual
        Scenario Outline: Additional advanced sections in Edit deployment/deployment config form
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


        @regression @todo
        Scenario Outline: Editing deployment through form view
            Given user has created deployment workload "workload-ad"
              And user is at the Topology page
             When user right clicks on the node "workload-ad" to open context menu
              And user selects option "Edit Deployment" option from context menu
              And user selects "RollingUpdate" Strategy type under Deployment Strategy
              And user enters value of Maximum number of unavailable Pods and Maximum number of surge Pods as "25%"
              And user selects value of project, image stream and tag section under images as "<Openshift>", "<image_stream>" and "<latest>" respectively
              And user clicks on "Show advanced container options"
              And user enters NAME as "<env_name>" and VALUE as "<env_value>"
              And user clicks on "Show advanced image options"
              And user creates a secret "new-secret1"
              And user selects secret "new-secret1" from Pull secret dropdown
              And user selects the "Pause rollouts" check box under advanced options section
              And user enters Replicas as "<replica>" under Scaling section
              And user clicks on Save
             Then user will be redirected to Topology with the updated deployment

        Examples:
                  | project   | image_stream    | tag    | env_name      | env_value                    | replica |
                  | Openshift | hello-openshift | latest | DEMO_GREETING | "Hello from the environment" | 2       |


        @regression @todo
        Scenario Outline: Editing deployment config through form view
            Given user has created deployment config workload "workload-adc"
              And user is at the Topology page
             When user right clicks on the node "workload-adc" to open context menu
              And user selects option "Edit DeploymentConfig" option from context menu
              And user selects "Recreate" Strategy type under Deployment Strategy
              And user enters Timeout value as "600"
              And user clicks on "Show additional parameters and lifcycle hooks"
              And user clicks on "Add Pre Cycle Hook"
              And user clicks on tick button
              And user clicks on "Add Mid Cycle Hook"
              And user clicks on tick button
              And user clicks on "Add Post Cycle Hook"
              And user clicks on tick button
              And user unchecks "Deploy image from an image stream tag" checkbox
              And user enters value of Image name as "<image_value>"
              And user clicks on "Show advanced image options"
              And user creates a secret "new-secret1"
              And user selects secret "new-secret1" from Pull secret dropdown
              And user selects the "Pause rollouts" check box under advanced options section
              And user enters Replicas as "<replica>" under Scaling section
              And user clicks on Save
             Then user will be redirected to Topology with the updated deployment config

        Examples:
                  | image_value                                                                                                            | replica |
                  | quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:51435011b4f381e292cd70c231d45a35add8b2d28ccac707c52802c143604630 | 4       |


        @regression @todo
        Scenario: Editing deployment resource limits through form view
            Given user has created deployment workload "workload-ad"
              And user is at the Topology page
             When user right clicks on the node "workload-ad" to open context menu
              And user selects option "Edit resource limits" from context menu
              And user enters value of CPU Request as "250"
              And user enters value of CPU Limit as "500"
              And user enters value of Memory Request as "64"
              And user enters value of Memory Limit as "128"
              And user clicks on Save
             Then user will be redirected to Topology with the updated resource limits
