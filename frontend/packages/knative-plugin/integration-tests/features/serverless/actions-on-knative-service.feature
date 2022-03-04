@knative
Feature: Perform actions on knative service
              As a user I want to perform edit or delete operations and Set Traffic Distribution on knative Service in topology page

        Background:
            Given user has created or selected namespace "aut-knative-service"
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


        @smoke
        Scenario: knative service menu options: KN-02-TC01
             When user right clicks on the knative service "kn-service"
             Then user is able to see the options like Edit Application Grouping, Set Traffic Distribution, Edit Health Checks, Edit Labels, Edit Annotations, Edit Service, Delete Service, Edit "kn-service"


        @regression
        Scenario: Edit labels modal details: KN-02-TC02
             When user right clicks on the knative service "kn-service"
              And user selects "Edit labels" from context menu
             Then modal with "Edit labels" appears
              And save, cancel buttons are displayed


        Scenario: Add label to the existing labels list: KN-02-TC03
             When user right clicks on the knative service "kn-service"
              And user selects "Edit labels" from context menu
              And user adds the label "app=label" to existing labels list in Edit Labels modal
              And user clicks on Save button
             Then user will see the label "app=label" in "kn-service" service side bar details


        Scenario: Remove label from existing labels list: KN-02-TC04
             When user selects "Edit labels" context menu option of knative service "kn-service"
              And user removes the label "app=label" from existing labels list in "Edit labels" modal
              And user clicks save button on the "Edit labels" modal
             Then user will not see the label "app=label" in "kn-service" service side bar details


        @regression
        Scenario: Edit Annotation modal details: KN-02-TC17
             When user selects "Edit annotations" context menu option of knative service "kn-service"
             Then modal with "Edit annotations" appears
              And key, value columns are displayed with respective text fields
              And Add more link is enabled
              And save, cancel buttons are displayed


        Scenario: Add annotation to the existing annotations list: KN-02-TC05
            Given number of annotations present in topology side bar for "kn-service" service
             When user selects "Edit annotations" context menu option of knative service "kn-service"
              And user clicks Add button on the Edit Annotations modal
              And user enters annotation key as "serving.knative.qe/creator"
              And user enters annotation value as "kube:admin"
              And user clicks save button on the "Edit annotations" modal
             Then number of Annotations increased for "kn-service" service in topology side bar details


        Scenario: Remove annotation from existing annotations list: KN-02-TC06
             When user selects "Edit annotations" context menu option of knative service "kn-service"
              And user clicks on remove icon for the annotation with key "serving.knative.qe/creator" present in Edit Annotations modal
              And user clicks save button on the "Edit annotations" modal
             Then number of Annotations decreased for "kn-service" service in topology side bar details


        @regression @to-do
        Scenario: Edit the service from yaml editor: KN-02-TC07
             When user selects "Edit Service" context menu option of knative service "kn-service"
              And user modifies the Yaml file of the Service details page
              And user clicks save button on yaml page
             Then message should display as "{service name} has been updated to version {nnnnnn}"
              And another message should display as "This object has been updated."


        @smoke
        Scenario: Update the service to new application group: KN-02-TC08
             When user selects "Edit application grouping" context menu option of knative service "kn-service"
              And user selects the Create Application option from application drop down present in Edit Application grouping modal
              And user enters "openshift-app" into the Application Name text box
              And user clicks save button on the "Edit application grouping" modal
              And user searches for application name "openshift-app"
              And user clicks on application node "openshift-app" on topology page
             Then updated service "kn-service" is present in side bar of application "openshift-app"


        @regression
        Scenario: Update the service to different application group existing in same project: KN-02-TC09
             When user selects "Edit application grouping" context menu option of knative service "kn-service"
              And user selects the "hello-openshift-app" option from application drop down present in Edit Application grouping modal
              And user clicks save button on the "Edit application grouping" modal
              And user searches for application name "hello-openshift-app"
              And user clicks on application node "hello-openshift-app" on topology page
             Then updated service "kn-service" is present in side bar of application "hello-openshift-app"

        @to-do
        Scenario: Set traffic distribution greater than 100% for the Revisions of the knative Service: KN-02-TC10
            Given user created another revision for knative Service "kn-service"
              And user is at the Topology page
             When user selects "Set traffic distribution" context menu option of knative service "kn-service"
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "50" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks save button on the "Set traffic distribution" modal
             Then error message displays as "validation failed: Traffic targets sum to 150, want 100: spec.traffic"

        @to-do
        Scenario: Set traffic distribution less than 100% for the Revisions of the knative Service: KN-02-TC11
            Given user created another revision for knative Service "kn-service"
              And user is at the Topology page
             When user selects "Set traffic distribution" context menu option of knative service "kn-service"
              And user enters "25" into the Split text box of new revision
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "50" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks save button on the "Set traffic distribution" modal
             Then error message displays as "validation failed: Traffic targets sum to 75, want 100: spec.traffic"


        @regression @broken-test
        Scenario: Set traffic distribution equal to 100% for the Revisions of the knative Service: KN-02-TC12
            Given user created another revision for knative Service "kn-service"
              And user is at the Topology page
             When user selects "Set traffic distribution" context menu option of knative service "kn-service"
              And user enters "51" into the Split text box of new revision
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "49" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks save button on the "Set traffic distribution" modal
              And user clicks on the knative service name "kn-service"
             Then number of revisions should get increased in side bar - resources tab - routes section


        @regression
        Scenario: Edit Health Checks for a service: KN-02-TC13
            Given user is at the Topology page
             When user selects "Edit Health Checks" context menu option of knative service "kn-service"
              And user adds the Liveness probe details
              And user clicks Save on Edit health checks page
             Then user redirects to topology page


        Scenario: Perform cancel opeartion on Edit NameOfWorkload for a service: KN-02-TC14
             When user selects "Edit kn-service" context menu option of knative service "kn-service"
              And user clicks cancel button on "Edit Service" page
             Then user will be redirected to Topology page


        @regression @broken-test
        Scenario: Edit NameOfWorkload for a service: KN-02-TC15
             When user selects "Edit kn-service" context menu option of knative service "kn-service"
              And user selects the "No Application group" option from Application drop down
              And user clicks save button on the Deploy Image Page
             Then user redirects to topology page
              And user is not able to see application group in Topology page


        @smoke @broken-test
        Scenario: Delete service: KN-02-TC16
             When user selects "Delete Service" context menu option of knative service "kn-service-1"
              And user clicks Delete button on Delete Service modal
             Then "kn-service-1" service should not be displayed in project
