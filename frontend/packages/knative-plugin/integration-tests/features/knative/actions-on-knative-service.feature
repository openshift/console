@knative
Feature: Perform actions on knative service
              As a user I want to perform edit or delete operations and Set Traffic Distribution on knative Service in topology page

        Background:
            Given user has created or selected namespace "aut-create-knative-actions-service"
              And user has created knative service "nodejs-ex-git"


        @regression
        Scenario: knative service menu options: Kn-04-TC01
            Given user is at the Topology page
             When user right clicks on the knative service "nodejs-ex-git"
             Then user is able to see the options like Edit Application Grouping, Set Traffic Distribution, Edit Health Checks, Edit Labels, Edit Annotations, Edit Service, Delete Service, "nodejs-ex-git"


        @regression
        Scenario: Edit labels modal details : Kn-04-TC02
            Given user is at the Topology page
             When user selects "Edit Labels" context menu option of knative service "nodejs-ex-git"
             Then modal with "Edit labels" appears
              And save, cancel buttons are displayed


        @regression
        Scenario: Add label to the existing labels list : Kn-04-TC03
            Given user is at the Topology page
             When user selects "Edit Labels" context menu option of knative service "nodejs-ex-git"
              And user adds the label "app=label" to existing labels list in Edit Labels modal
              And user clicks the save button on the "Edit labels" modal
             Then user will see the label "app=label" in "nodejs-ex-git" service side bar details


        @regression
        Scenario: Remove label from existing labels list : Kn-04-TC04
            Given user is at the Topology page
              And label "app=label" is added to the knative service "nodejs-ex-git"
             When user selects "Edit Labels" context menu option of knative service "nodejs-ex-git"
              And user removes the label "app=label" from existing labels list in "Edit labels" modal
              And user clicks the save button on the "Edit labels" modal
             Then user will not see the label "app=label" in "nodejs-ex-git" service side bar details


        @regression
        Scenario: Add labels to existing labels list and cancel it : Kn-04-TC05
            Given user has created another knative service "nodejs-ex-git-1"
              And user is at the Topology page
             When user selects "Edit Labels" context menu option of knative service "nodejs-ex-git"
              And user adds the label "app=label" to existing labels list in Edit Labels modal
              And user clicks cancel button on the "Edit labels" modal
             Then user will not see the label "app=label" in "nodejs-ex-git" service side bar details


        @regression
        Scenario: Edit Annotation modal details : Kn-04-TC11
            Given user is at the Topology page
             When user selects "Edit Annotations" context menu option of knative service "nodejs-ex-git"
             Then modal with "Edit annotations" appears
              And key, value columns are displayed with respecitve text fields
              And Add more link is enabled
              And save, cancel buttons are displayed


        @regression
        Scenario: Add annotation to the existing annotations list : Kn-04-TC12
            Given user is at the Topology page
              And number of annotations are "5" present in "nodejs-ex-git" service side bar details tab
             When user selects "Edit Annotations" context menu option of knative service "nodejs-ex-git"
              And user clicks Add button on the Edit Annotations modal
              And user enters annotation key as "serving.knative.qe/creator "
              And user enters annotation value as "kube:admin"
              And user clicks the save button on the "Edit annotations" modal
             Then number of Annotations increased to "6" in "nodejs-ex-git" service side bar details


        Scenario: perform cancel action after Edit Annotations : Kn-04-TC14
            Given user is at the Topology page
              And number of annotations are "5" present in "nodejs-ex-git" service side bar details tab
             When user selects "Edit Annotations" context menu option of knative service "nodejs-ex-git"
              And user clicks on remove icon for the annotation with key "serving.knative.dev/creator" present in Edit Annotations modal
              And user clicks cancel button on the "Edit annotations" modal
             Then number of Annotations display as "5" in "nodejs-ex-git" service side bar details


        @regression
        Scenario: Remove annotation from existing annotations list : Kn-04-TC13
            Given user is at the Topology page
              And number of annotations are "6" present in side bar - details tab
             When user selects "Edit Annotations" context menu option of knative service "nodejs-ex-git"
              And user clicks on remove icon for the annotation with key "serving.knative.dev/creator" present in Edit Annotations modal
              And user clicks the save button on the "Edit annotations" modal
             Then number of Annotations decreased to "5" in side bar details


        @regression
        Scenario: Edit the service from yaml editor: Kn-04-TC15
            Given user is at the Topology page
             When user selects "Edit Service" context menu option of knative service "nodejs-ex-git"
              And user modifies the Yaml file of the Service details page
              And user clicks save button on yaml page
             Then message should display as "{service name} has been updated to version {nnnnnn}"
              And another message should display as "This object has been updated."


        @regression
        Scenario: Update the service to different application group existing in same project : Kn-04-TC07
            Given user has created a workload named "openshift-app"
              And user is at the Topology page
             When user selects "Edit Application Grouping" context menu option of knative service "nodejs-ex-git"
              And user selects the "openshift-app" option from application drop down present in "Edit Application Grouping" modal
              And user clicks the save button on the "Edit Application Grouping" modal
              And user searches for application name "openshift-app"
              And user clicks on "openshift-app" on topology page
             Then updated service is present in side bar


        Scenario: Perform cancel operation while editing application group : Kn-04-TC08
            Given user is at the Topology page
             When user selects "Edit Application Grouping" context menu option of knative service "nodejs-ex-git"
              And user selects the "openshift-app" option from application drop down present in "Edit Application Grouping" modal
              And user clicks cancel button on the "Edit Application Grouping" modal
              And user searches for application name "openshift-app"
              And user clicks on "openshift-app" on topology page
             Then updated service should not display in side bar


        @regression
        Scenario: Update the service to new application group : Kn-04-TC06
            Given user is at the Topology page
             When user selects "Edit Application Grouping" context menu option of knative service "nodejs-ex-git"
              And user selects the "openshift-app" option from application drop down present in "Edit Application Grouping" modal
              And user enters "openshift-app" into the Application Name text box
              And user clicks the save button on the "Edit Application Grouping" modal
              And user searches for application name "openshift-app"
              And user clicks on "openshift-app" on topology page
             Then updated service is present in side bar


        @regression
        Scenario: Set traffic distribution greater than 100% for the Revisions of the knative Service : Kn-04-TC17
            Given user created another revision "nodejs-ex-git-1" for knative Service "nodejs-ex-git"
              And user is at the Topology page
             When user selects "Set Traffic Distribution" context menu option of knative service "nodejs-ex-git"
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "50" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks the save button on the "Set Traffic Distribution" modal
             Then error message displays as "validation failed: Traffic targets sum to 150, want 100: spec.traffic"


        @regression
        Scenario: Set traffic distribution less than 100% for the Revisions of the knative Service : Kn-04-TC18
            Given user created another revision "nodejs-ex-git-1" for knative Service "nodejs-ex-git"
              And user is at the Topology page
             When user selects "Set Traffic Distribution" context menu option of knative service "nodejs-ex-git"
              And user enters "25" into the Split text box of new revision
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "50" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks the save button on the "Set Traffic Distribution" modal
             Then error message displays as "validation failed: Traffic targets sum to 75, want 100: spec.traffic"


        @smoke
        Scenario: Set traffic distribution equal to 100% for the Revisions of the knative Service : Kn-04-TC19
            Given user created another revision "nodejs-ex-git-1" for knative Service "nodejs-ex-git"
              And user is at the Topology page
             When user selects "Set Traffic Distribution" context menu option of knative service "nodejs-ex-git"
              And user enters "50" into the Split text box of new revision
              And user clicks on Add Revision button present in Set Traffic Distribution modal
              And user enters "50" into the Split text box of new revision
              And user selects another revision from Revision drop down
              And user clicks the save button on the "Set Traffic Distribution" modal
             Then number of routes should get increased in side bar - resources tab - routes section


        Scenario: Perform cancel opeartion on Edit Health Checks for a service : Kn-04-TC10
            Given user is at the Topology page
             When user selects "Edit Health Checks" context menu option of knative service "nodejs-ex-git"
              And user clicks cancel button on "Edit Health Checks" page
             Then user will be redirected to Topology page


        @regression
        Scenario: Edit Health Checks for a service: Kn-04-TC09
            Given user is at the Topology page
             When user selects "Edit Health Checks" context menu option of knative service "nodejs-ex-git"


        Scenario: Perform cancel opeartion on Edit NameOfWorkload for a service : Kn-04-TC21
            Given user is at the Topology page
             When user selects "Edit nodejs-ex-git" context menu option of knative service "nodejs-ex-git"
              And user clicks cancel button on "Edit Service" page
             Then user will be redirected to Topology page


        @regression
        Scenario: Edit NameOfWorkload for a service [TBD] : Kn-04-TC20
            Given user is at the Topology page
             When user selects "Edit nodejs-ex-git" context menu option of knative service "nodejs-ex-git"
              And user selects the "Application -1" option from Application drop down
              And user clicks save button on the Edit Service Page


        @smoke
        Scenario: Delete service : Kn-04-TC16
            Given user is at the Topology page
             When user selects "Delete Service" context menu option of knative service "nodejs-ex-git"
             Then modal with "Delete Service?" appears
              And modal get closed on clicking Delete button
              And "nodejs-ex-git" service should not be displayed in project
