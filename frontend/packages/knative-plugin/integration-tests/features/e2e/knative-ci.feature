@knative @smoke
Feature: Perform actions on knative service and revision
              As a user, I want to perform edit or delete operations on knative revision in topology page

        Background:
              And user is at Topology page in the admin view

        @pre-condition
        Scenario Outline: Create knative workload from From Git card on Add page: KN-05-TC04
            Given user has created or selected namespace "knative-ci"
              And user selects Import from Git from quick create
             When user enters Git Repo url as "<git_url>"
              And user enters Name as "<workload_name>"
              And user selects resource type as "Serverless Deployment"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page
              And user is able to see Knative Revision

        Examples:
                  | git_url                                 | workload_name |
                  | https://github.com/sclorg/nodejs-ex.git | kn-service    |

        @manual
        Scenario Outline: Create knative workload using Container image with extrenal registry on Add page: KN-05-TC05
            Given user is at developer perspective
              And user has created or selected namespace "knative-ci"
              And user is at Add page
              And user is at Deploy Image page
             When user enters Image name from external registry as "<image_name>"
              And user enters workload name as "<workload_name>"
              And user selects resource type as "Serverless Deployment"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page

        Examples:
                  | image_name                         | workload_name |
                  | quay.io/openshift-knative/showcase | kn-service    |


        # Marking the following test as manual to reduce load on ci from new tests based on relavance
        @manual
        Scenario: knative service menu options: KN-02-TC01
            Given user has created or selected namespace "knative-ci"
             When user right clicks on the knative service "kn-service" to open the context menu
             Then user is able to see the options like Edit Application Grouping, Set Traffic Distribution, Edit Health Checks, Edit Labels, Edit Annotations, Edit Service, Delete Service, Edit "kn-service"


        # Marking the following test as manual to reduce load on ci from new tests based on relavance
        @manual
        Scenario: side bar details of knative Service: KN-06-TC01
            Given user has created or selected namespace "knative-ci"
             When user clicks on the knative service "kn-service"
             Then side bar is displayed with heading name as "kn-service"
              And Name, Namespace, Labels, Annotations, Created at, Owner fields displayed in topology details
              And Pods, Revisions and Routes displayed in Resources section


        Scenario: Edit labels modal details: KN-02-TC02
            Given user has created or selected namespace "knative-ci"
             When user right clicks on the knative service "kn-service" to open the context menu
              And user selects "Edit labels" from context menu
             Then modal with "Edit labels" appears
              And save, cancel buttons are displayed


        Scenario: Edit Annotation modal details: KN-02-TC17
            Given user has created or selected namespace "knative-ci"
             When user right clicks on the knative service "kn-service" to open the context menu
              And user selects "Edit annotations" from context menu
             Then modal with "Edit annotations" appears
              And key, value columns are displayed with respective text fields
              And Add more link is enabled
              And save, cancel buttons are displayed



        @regression
        Scenario: Create new Event Source: KA-01-TC01
            Given user has created knative service "kn-service" in admin
              And user is at administrator perspective
              And user is at eventing page
             When user clicks on Create dropdown button
              And user selects Event Source
              And user clicks on Ping Source
              And user enters "Message" in Data field
              And user enters "* * * * *" in Schedule field
              And user selects resource "kn-service"
              And user clicks on Create button to submit
             Then user will be redirected to Topology page
              And ApiServerSource event source "ping-source" is created and linked to selected knative service "kn-service"


        @regression
        Scenario: Create new Channel: KA-01-TC02
            Given user is at eventing page
             When user clicks on Create dropdown button
              And user selects Channel
              And user selects Default channels
              And user clicks on Create button to create channel
             Then user will be redirected to Topology page
              And user will see the channel "channel" created


        Scenario: Create Broker using Form view: KE-05-TC01
            Given user is at eventing page
             When user clicks on Create dropdown button
              And user selects Broker
              And user selects Form view
              And user enters broker name as "default-broker"
              And user clicks on Create button to create broker
             Then user will be redirected to Topology page
              And user will see the "default-broker" broker created


        Scenario: Add Subscription to channel: KE-05-TC01
            # Given user has created knative service "knative-ci-2" in admin
            #   And user has created channel "channel"
            #   And user is at Topology page
             When user right clicks on the Channel "channel" to open the context menu
              And user selects "Add Subscription" from Context Menu
              And user enters Name as "channel-subscrip" on Add Subscription modal
              And user selects Subscriber "kn-service" on Add Subscription modal
              And user clicks on Add button
             Then user will see connection between Channel "channel" and Subscriber "kn-service"


        Scenario: Update the service to new application group: KN-02-TC08
            Given user has created or selected namespace "knative-ci"
             When user right clicks on the knative service "kn-service" to open the context menu
              And user selects "Edit application grouping" from context menu
              And user selects the Create Application option from application drop down present in Edit Application grouping modal
              And user enters "openshift-app" into the Application Name text box
              And user clicks save button on the "Edit application grouping" modal
              And user searches for application name "openshift-app"
              And user clicks on application node "openshift-app" on topology page
             Then updated service "kn-service" is present in side bar of application "openshift-app"


        # Marking the following test as manual to reduce load on ci from new tests based on relavance
        @manual
        Scenario: Context menu for knative Revision: KN-01-TC01
            Given user has created or selected namespace "knative-ci"
              And Knative Revision is available in topology page
             When user right clicks on the revision of knative service "kn-service" to open the context menu
             Then user is able to see Edit Labels, Edit Annotations, Edit Revision, Delete Revision options in context menu

        @broken-test
        Scenario: side bar details of knative Revision: KN-06-TC02
            Given user has created or selected namespace "knative-ci"
             When user clicks on the revision of knative service "kn-service"
             Then side bar is displayed with heading name as "kn-service"
              And Name, Namespace, Labels, Annotations, Created at, Owner fields displayed in topology details
              And Pods, Deployment, Routes and Configurations displayed in Resources section


        Scenario: Delete Revision not possible for the service which contains one revision: KN-01-TC12
            Given user has created or selected namespace "knative-ci"
             When user right clicks on the revision of knative service "kn-service" to open the context menu
              And user selects "Delete Revision" option from knative revision context menu
             Then user is able to see message "You cannot delete the last Revision for the Service." in modal with header "Unable to delete Revision"


        Scenario: Create Revision for the existing knative Service
            Given user has created or selected namespace "knative-ci"
             When user right clicks on the knative service "kn-service" to open the context menu
              And user selects "Edit kn-service" from context menu
              And user modifies the details of knative service
              And user clicks Save on the Edit knative service page
              And user clicks on the knative service "kn-service"
             Then user is able to see multiple revisions for knative service "kn-service" in Resources section of topology sidePane


        Scenario: Set traffic distribution greater than 100% for the Revisions of the knative Service: KN-02-TC10
            Given user has created or selected namespace "knative-ci"
             When user selects "Set traffic distribution" context menu option of knative service "kn-service"
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "50" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks save button on the "Set traffic distribution" modal
             Then error message displays as "validation failed: Traffic targets sum to 150, want 100: spec.traffic"


        Scenario: Set traffic distribution less than 100% for the Revisions of the knative Service: KN-02-TC11
            Given user has created or selected namespace "knative-ci"
             When user selects "Set traffic distribution" context menu option of knative service "kn-service"
              And user enters "25" into the Split text box of new revision
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "50" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks save button on the "Set traffic distribution" modal
             Then error message displays as "validation failed: Traffic targets sum to 75, want 100: spec.traffic"

        @broken-test
        Scenario: Set traffic distribution equal to 100% for the Revisions of the knative Service: KN-02-TC12
            Given user has created or selected namespace "knative-ci"
             When user selects "Set traffic distribution" context menu option of knative service "kn-service"
              And user enters "51" into the Split text box of new revision
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "49" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks save button on the "Set traffic distribution" modal
              And user clicks on the knative service name "kn-service"
             Then number of revisions should get increased in side bar - resources tab - routes section


        @regression
        Scenario: Delete Broker action on Broker: KE-05-TC11
             When user clicks on the "default-broker" broker to open the sidebar
              And user selects "Delete Broker" from Actions drop down
              And user clicks on the Delete button on the modal
             Then user will not see "default-broker" broker in admin view topology


        @regression
        Scenario: Delete Channel action on Channel: KE-06-TC16
            Given user has already created the channel "channel"
             When user right clicks on the channel "channel"
              And user clicks on the "Delete Channel"
              And user clicks on the Delete button on the modal
             Then user will not see channel "channel"


        @regression
        Scenario: Delete event source: KE-01-TC03
            # Given user has created knative service "kn-service"
            #   And user has created Sink Binding event source "ping-source" with knative resource "kn-service"
             When user clicks on event source "ping-source" to open side bar
              And user selects "Delete PingSource" from side bar Action menu
              And user selects the Delete option on "Delete PingSource" modal
             Then event source "ping-source" will not be displayed in topology page


        @broken-test
        Scenario: Delete revision modal details for service with multiple revisions: KN-01-TC10
            Given user has created or selected namespace "knative-ci"
             When user right clicks on the revision of knative service "kn-service" to open the context menu
             When user selects "Delete Revision" from context menu
             Then modal with alert description "Update the traffic distribution among the remaining Revisions" appears


        Scenario: Delete service: KN-02-TC16
            Given user has created or selected namespace "knative-ci"
             When user selects "Delete Service" context menu option of knative service "kn-service"
              And user clicks Delete button on Delete Service modal
             Then "kn-service" service should not be displayed in project

        @broken-test
        Scenario Outline: Create serverless function using Create Serverless function form with Builder Images: SF-01-TC06
            Given user has created or selected namespace "knative-ci"
              And user is at Add page
             When user clicks on Create Serverless function card
              And user enters git url "<git_url>"
              And user is able to see builder image version dropdown
              And user is able to see the runtime details
              And user clicks on Create button on Create Serverless function
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page
              And user clicks on the Knative Service workload "<workload_name>"
              And user switches to the "Details" tab
              And user is able to see Type as Function

        Examples:
                  | git_url                                           | workload_name       |
                  | https://github.com/vikram-raj/hello-func-node-env | hello-func-node-env |
