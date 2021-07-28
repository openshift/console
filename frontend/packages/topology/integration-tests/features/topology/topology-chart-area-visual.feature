@topology
Feature: Topology chart area
              As a user, I want to verify topology chart visuals

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-delete-workload"


        @smoke
        Scenario: Empty state of topology: T-06-TC01
             When user navigates to Topology page
             Then user sees Topology page with message "No resources found"


        @regression
        Scenario: Navigate to Add page from Empty state of topology: T-06-TC02
            Given user is at the Topology page
             When user clicks on "Add page" link in the topology page
             Then user will be redirected to Add page


        @regression
        Scenario: Add to project option in Empty state of topology: T-06-TC03
            Given user is at the Topology page
             When user clicks on "Start building your application" link in the empty topology page
             Then user will be able to see Add to project search bar


        @smoke
        Scenario: Topology with workloads: T-06-TC04
            Given user has created a deployment workload named "nodejs-ex-git-1"
              And user has created a deployment config workload "nodejs-ex-git-2"
             When user navigates to Topology page
             Then user sees "nodejs-ex-git-1" and "nodejs-ex-git-2" workloads in topology chart area



        @regression @manual
        Scenario: Visual for deployment: T-06-TC05
            Given user has created a workload named "nodejs-ex-git"
              And user is at the Topology page
             When user checks nodes and the decorators associated with them
             Then nodes are circular shaped with builder image in them
              And pod ring associated with node are present around node with color according to the pod status
              And deployment can have application url on top-right of the node
              And user sees edit source code decorator is on bottom right of the node which can lead to github or che workspace
              And user sees build decorator on bottom left which will take user to either build tab or pipeline depending on pipeline associated with them
              And user checks node label having "D" for deployment and then name of node


        @regression @manual
        Scenario: Visual for deployment-config: T-06-TC06
            Given user is at the Topology page
              And deployment-config workload is present in topology
             When user checks nodes and the decorators associated with them
             Then nodes are circular shaped with builder image in them
              And pod ring associated with node are present around node with color according to the pod status
              And deployment-config can have application url on top-right of the node
              And user sees edit source code decorator is on bottom right of the node which can lead to github or che workspace
              And user sees build decorator on bottom left which will take user to either build tab or pipeline depending on pipeline associated with them
              And user checks node label having "DC" for deployment-config and then name of node


        @regression @manual
        Scenario: Visual for knative service with no revision: T-06-TC07
            Given user is at the Topology page
              And knative workload without revision is present in topology
             When user checks nodes and the decorators associated with them
             Then user can view knative service are rectangular shaped with round corners
              And user can see dotted boundary with text "No Revision" mentioned
              And knative sevice app can have application url on top-right of the node
              And user sees build decorator on bottom left on knative service app which will take user to build tab
              And user checks knative service having label "KSVC" and then the name of service


        @regression @manual
        Scenario: Visual for knative service with revisions: T-06-TC08
            Given user is at the Topology page
              And knative workload with revison is present in topology
             When user checks nodes and the decorators associated with them
             Then user can view knative service are rectangular shaped with round corners
              And user can see knative service app with dotted boundary with revision present inside it
              And knative sevice app can have application url on top-right of the node
              And user can see traffic distribution from knative sevice app to its revisions with its percentage number
              And pod ring associated with revisions are present around node with color according to the pod status
              And knative revision can have application url on top-right of the node
              And user sees edit source code decorator is on bottom right of the revision which can lead to github or che workspace
              And user sees build decorator on bottom left on knative service app which will take user to either build tab
              And user checks revisions having label "REV" and then the name
              And user checks knative service having label "KSVC" and then the name of service


        @smoke @to-do
        Scenario: Context menu of node: T-06-TC09
            Given user has created a workload named "nodejs-ex-git"
              And user is at the Topology page
             When user right clicks on the node "nodejs-ex-git" to open context menu
             Then user is able to see context menu options like Edit Application Grouping, Edit Pod Count, Pause Rollouts, Add Health Checks, Add Horizontal Pod Autoscaler, Add Storage, Edit Update Strategy, Edit Labels, Edit Annotations, Edit Deployment, Delete Deployment


        @regression @manual
        Scenario: Zoom In in topology: T-06-TC10
            Given user has created a workload named "nodejs-ex-git"
              And user is at the Topology page
             When user clicks on Zoom In option
             Then user sees the chart area is zoomed


        @regression @manual
        Scenario: Zoom Out in topology: T-06-TC11
            Given user has created a workload named "nodejs-ex-git"
              And user is at the Topology page
             When user clicks on Zoom Out option
             Then user sees the chart area is zoomed out


        @regression @manual
        Scenario: Fit to Screen in topology: T-06-TC12
            Given user has created a workload named "nodejs-ex-git"
              And user is at the Topology page
             When user clicks on Zoom In option
              And user sees the chart area is zoomed
              And user clicks on Fit to Screen option
             Then user sees the nodes fitting within chart area


        @regression @manual
        Scenario: Reset view in topology: T-06-TC13
            Given user has created a workload named "nodejs-ex-git"
              And user is at the Topology page
             When user clicks on Zoom In option
              And user sees the chart area is zoomed
              And user clicks on Reset View option
             Then user sees the chart area is reset to original


        @regression
        Scenario Outline: Topology filter by resource: T-06-TC14
            Given user created "<resource_type>" workload
             When user is at Topology page chart view
              And user clicks the filter by resource on top
              And user clicks on "<resource_type>" option
             Then user can see only the "<resource_type>" workload

        Examples:
                  | resource_type    |
                  | Deployment       |
                  | DeploymentConfig |


        @regression @to-do
        Scenario: Context menu on empty area: T-06-TC15
            Given user is at the Topology page
             When user right clicks on the empty chart area
              And user hovers on Add to Project
             Then user is able to see options like Samples, From Git, Container Image, From Dockerfile, From Devfile, From Catalog, Database, Operator Backed, Helm Charts, Event Source, Channel


        @regression @to-do
        Scenario: Add to Project in topology: T-06-TC16
            Given user is at the Topology page
             When user right clicks on the empty chart area
              And user hovers on Add to Project
              And user clicks on Samples
              And user selects go sample and clicks Create
              And user hovers on Add to Project and clicks on From Git
              And user fills the form and clicks Create
              And user hovers on Add to Project and clicks on Container Image
              And user fills the form and clicks Create
              And user hovers on Add to Project and clicks on From Dockerfile
              And user fills the form and clicks Create
              And user hovers on Add to Project and clicks on From Devfile
              And user fills the form and clicks Create
              And user hovers on Add to Project and clicks on From Catalog
              And user selects Python Builder Image and clicks Create Application
              And user fills the form and clicks Create
              And user hovers on Add to Project and clicks on Database
              And user selects Postgres Database and clicks on Create
              And user fills the form and clicks Create
              And user hovers on Add to Project and clicks on Operator Backed
              And user selects Postgres and clicks on Create
              And user fills the form and clicks Create
              And user hovers on Add to Project and clicks on Helm Charts
              And user selects Nodejs Ex K v0.2.1 and clicks on Install Helm Charts
              And user clicks on Install
              And user hovers on Add to Project and clicks on From Event Source
              And user selects Api Server Source and clicks on Create Event Source
              And user fills the form and clicks Create
              And user hovers on Add to Project and clicks on From Channel
              And user clicks on Create
             Then user is able to see different applications created from Samples, From Git, Container Image, From Dockerfile, From Devfile, From Catalog, Database, Operator Backed, Helm Charts, Event Source, Channel


        @regression @manual
        Scenario: Upload JAR file form: T-06-TC17
            Given user has a jar file named "sample_yaml_upload.yaml"
              And user is at the Topology page
             When user drags and drop jar file on topology
             Then user sees Upload JAR file form
              And user can see JAR section with jar file name with Browse and Clear button associated with it
              And user can see Optional java commands, Runtime icon and Build image version under JAR section
              And user can see General section with Application name and Name under it
              And user can see Resources and Advanced options sections


        @regression @manual
        Scenario: Drag and drop jar file in topology chart view: T-06-TC18
            Given user has a jar file named "sample_yaml_upload.yaml"
              And user is at the Topology page
             When user drags and drop jar file on topology
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks on Create in Upload JAR file form
             Then user is redirected to topology
              And user can see a toast notification of JAR file uploading with link to build logs
              And user can see deployment "sample-yaml-upload" in application "sample-upload-app" is created in topology


        @regression @manual
        Scenario: Add to Project to upload JAR file in topology: T-06-TC19
            Given user is at the Topology page
             When user right clicks on the empty chart area
              And user clicks on Add to Project
              And user clicks on Upload JAR file
              And user clicks on Browse in JAR file section
              And user selects file to upload
              And user clicks Clear and reupload the file
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload-1"
              And user clicks on Create
             Then user is redirected to topology
              And user can see a toast notification of JAR file uploading with link to build logs
              And user can see deployment "sample-yaml-upload-1" in application "sample-upload-app" is created in topology


        @regression @manual
        Scenario: Add to Project through drag and drop to upload JAR file in topology: T-06-TC20
            Given user is at the Topology page
             When user right clicks on the empty chart area
              And user clicks on Add to Project
              And user clicks on Upload JAR file
              And user drag and drop the file in JAR file section
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload-1"
              And user clicks on Create
             Then user is redirected to topology
              And user can see a toast notification of JAR file uploading with link to build logs
              And user can see deployment "sample-yaml-upload-1" in application "sample-upload-app" is created in topology


        @regression @manual
        Scenario: Drag and drop Incompatible file in topology chart view: T-06-TC21
            Given user has a incompatible file
              And user is at the Topology chart view
             When user drags and drops the file on topology
             Then a toast warning message will appear stating that the file is invalid.


        @regression @manual
        Scenario: Exiting the browser while an upload is in progress: T-06-TC22
            Given user is uploading a jar file
              And user is at the Topology chart view
             When user tries to exist the browser
             Then a web alert would appear asking the user if they really wanted to leave the page with Leave and Skip button


        @regression @manual
        Scenario: View shortcuts menu: T-06-TC23
            Given user has uploaded a jar file
             When user clicks on View shortcuts
             Then user sees shortcut for Move
              And user sees shortcut for Edit Application grouping
              And user sees shortcut for Access context menu
              And user sees shortcut for View details in side panel
              And user sees shortcut for Access create connector handle
              And user sees shortcut for Qpen quick search modal
              And user sees shortcut for Drag and drop a JAR file into Topology
