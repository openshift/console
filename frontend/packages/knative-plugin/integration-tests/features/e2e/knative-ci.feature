@knative @smoke
Feature: Perform actions on knative service and revision
              As a user, I want to perform edit or delete operations on knative revision in topology page

        Background:
            Given user has created or selected namespace "knative-ci"
              And user is at Topology page


        @pre-condition
        Scenario Outline: Create knative workload using Container image with extrenal registry on Add page: KN-05-TC05
            Given user is at Add page
              And user is at Deploy Image page
             When user enters Image name from external registry as "<image_name>"
              And user enters workload name as "<workload_name>"
              And user selects resource type as "Serverless Deployment"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page

        Examples:
                  | image_name                | workload_name |
                  | openshift/hello-openshift | kn-service    |


        Scenario: knative service menu options: KN-02-TC01
             When user right clicks on the knative service "kn-service" to open the context menu
             Then user is able to see the options like Edit Application Grouping, Set Traffic Distribution, Edit Health Checks, Edit Labels, Edit Annotations, Edit Service, Delete Service, Edit "kn-service"


        Scenario: side bar details of knative Service: KN-06-TC01
             When user clicks on the knative service "kn-service"
             Then side bar is displayed with heading name as "kn-service"
              And Name, Namespace, Labels, Annotations, Created at, Owner fields displayed in topology details
              And Pods, Revisions and Routes displayed in Resources section


        Scenario: Edit labels modal details: KN-02-TC02
             When user right clicks on the knative service "kn-service" to open the context menu
              And user selects "Edit labels" from context menu
             Then modal with "Edit labels" appears
              And save, cancel buttons are displayed


        Scenario: Edit Annotation modal details: KN-02-TC17
             When user right clicks on the knative service "kn-service" to open the context menu
              And user selects "Edit annotations" from context menu
             Then modal with "Edit annotations" appears
              And key, value columns are displayed with respective text fields
              And Add more link is enabled
              And save, cancel buttons are displayed


        Scenario: Update the service to new application group: KN-02-TC08
             When user right clicks on the knative service "kn-service" to open the context menu
              And user selects "Edit Application grouping" from context menu
              And user selects the Create Application option from application drop down present in Edit Application grouping modal
              And user enters "openshift-app" into the Application Name text box
              And user clicks save button on the "Edit Application grouping" modal
              And user searches for application name "openshift-app"
              And user clicks on application node "openshift-app" on topology page
             Then updated service "kn-service" is present in side bar of application "openshift-app"


        Scenario: Context menu for knative Revision: KN-01-TC01
            Given Knative Revision is available in topology page
             When user right clicks on the revision of knative service "kn-service" to open the context menu
             Then user is able to see Edit Labels, Edit Annotations, Edit Revision, Delete Revision options in context menu


        Scenario: side bar details of knative Revision: KN-06-TC02
             When user clicks on the revision of knative service "kn-service"
             Then side bar is displayed with heading name as "kn-service"
              And Name, Namespace, Labels, Annotations, Created at, Owner fields displayed in topology details
              And Pods, Deployment, Routes and Configurations displayed in Resources section


        Scenario: Delete Revision not possible for the service which contains one revision: KN-01-TC12
             When user right clicks on the revision of knative service "kn-service" to open the context menu
              And user selects "Delete Revision" option from knative revision context menu
             Then user is able to see message "You cannot delete the last Revision for the Service." in modal with header "Unable to delete Revision"


        Scenario: Create Revision for the existing knative Service
             When user right clicks on the knative service "kn-service" to open the context menu
              And user selects "Edit kn-service" from context menu
              And user modifies the details of knative service
              And user clicks Save on the Edit knative service page
              And user clicks on the knative service "kn-service"
             Then user is able to see multiple revisions for knative service "kn-service" in Resources section of topology sidePane


        Scenario: Set traffic distribution greater than 100% for the Revisions of the knative Service: KN-02-TC10
             When user selects "Set traffic distribution" context menu option of knative service "kn-service"
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "50" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks save button on the "Set traffic distribution" modal
             Then error message displays as "validation failed: Traffic targets sum to 150, want 100: spec.traffic"


        Scenario: Set traffic distribution less than 100% for the Revisions of the knative Service: KN-02-TC11
             When user selects "Set traffic distribution" context menu option of knative service "kn-service"
              And user enters "25" into the Split text box of new revision
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "50" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks save button on the "Set traffic distribution" modal
             Then error message displays as "validation failed: Traffic targets sum to 75, want 100: spec.traffic"


        Scenario: Set traffic distribution equal to 100% for the Revisions of the knative Service: KN-02-TC12
             When user selects "Set traffic distribution" context menu option of knative service "kn-service"
              And user enters "51" into the Split text box of new revision
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "49" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks save button on the "Set traffic distribution" modal
              And user clicks on the knative service name "kn-service"
             Then number of revisions should get increased in side bar - resources tab - routes section


        Scenario: Delete revision modal details for service with multiple revisions: KN-01-TC10
             When user right clicks on the revision of knative service "kn-service" to open the context menu
             When user selects "Delete Revision" from context menu
             Then modal with alert description "Update the traffic distribution among the remaining Revisions" appears


        Scenario: Delete service: KN-02-TC16
             When user selects "Delete Service" context menu option of knative service "kn-service"
              And user clicks Delete button on Delete Service modal
             Then "kn-service" service should not be displayed in project
