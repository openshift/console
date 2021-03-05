@knative
Feature: Perform actions on knative revision
              As a user, I want to perform edit or delete operations on knative revision in topology page

        Background:
            Given user has created or selected namespace "aut-knative-actions-revision"
              And user has created knative revision with knative service "nodejs-ex-git-2"
              And user is at the Topology page


        @smoke
        Scenario: Context menu for knative Revision: Kn-03-TC01
             When user right clicks on the revision of knative service "nodejs-ex-git-2" to open the context menu
             Then user is able to see Edit Labels, Edit Annotations, Edit Revision, Delete Revision options in context menu


        @regression
        Scenario: Add new label to knative Revision: Kn-03-TC03
             When user right clicks on the revision of knative service "nodejs-ex-git-2" to open the context menu
              And user selects "Edit Labels" option from knative revision context menu
              And user adds the label "app=label" to existing labels list in Edit Labels modal
              And user clicks on Save button
             Then user can see the label "app-label" in the Details tab of the Sidebar of "nodejs-ex-git-2"


        @regression
        Scenario: Remove label from knative Revision: Kn-03-TC04
             When user right clicks on the revision of knative service "nodejs-ex-git-2" to open the context menu
              And user selects "Edit Labels" option from knative revision context menu
              And user removes the label "app=label" from existing labels list in "Edit Labels" modal
              And user clicks on Save button
             Then user will not see the label "app-label" in the Details tab of the Sidebar of "nodejs-ex-git-2"


        @regression
        Scenario: Add labels to existing labels list and cancel the activity : Kn-03-TC05
             When user right clicks on the revision of knative service "nodejs-ex-git-2" to open the context menu
              And user selects "Edit Labels" option from knative revision context menu
              And user adds the label "app=label" to existing labels list in Edit Labels modal
              And user clicks cancel button on the "Edit Labels" modal
             Then user will not see the label "app-label" in the Details tab of the Sidebar of "nodejs-ex-git-2"


        @regression
        Scenario: Add annotation to the existing annonations list : Kn-03-TC07
            Given number of annotations are "5" present in revision side bar details of service "nodejs-ex-git-2"
             When user right clicks on the revision of knative service "nodejs-ex-git-2" to open the context menu
              And user selects "Edit Annotaions" option from knative revision context menu
              And user clicks Add button on the Edit Annotaions modal
              And user enters annotation key as "serving.knative.dev/creator"
              And user enters annotation value as "kube:admin"
              And user clicks the save button on the "Edit Annotaions" modal
             Then number of annotaions increased to "6" in revision side bar details of service "nodejs-ex-git-2"


        @regression
        Scenario: perform cancel action on Edit Annotations : Kn-03-TC09
            Given number of annotations are "5" present in revision side bar details of service "nodejs-ex-git-2"
             When user right clicks on the revision of knative service "nodejs-ex-git-2" to open the context menu
              And number of annotations are "6" present in side bar - details tab- annotation section
             When user selects "Edit Annotations" option from knative revision context menu
              And user clicks on "remove" icon for the annotation with key "serving.knative.dev/creator" present in "Edit Annotaions" modal
              And user clicks cancel button on the "Edit Annotaions" modal
             Then verify the number of annotaions equal to "6" in side bar details


        @regression
        Scenario Outline: Remove annotation from existing annonations list : Kn-03-TC08
            Given number of annotations are "5" present in revision side bar details of service "nodejs-ex-git-2"
             When user right clicks on the revision of knative service "nodejs-ex-git-2" to open the context menu
              And number of annotations are "6" present in side bar - details tab
             When user selects "Edit Annotaions" option from knative revision context menu
              And user clicks on "remove" icon for the annotation with key "<key_name>" present in "Edit Annotaions" modal
              And user clicks the save button on the "Edit Annotaions" modal
             Then verify the number of annotaions decreased to "5" in side bar details

        Examples:
                  | key_name                    |
                  | serving.knative.dev/creator |


        @regression @manual
        Scenario: Edit revision details page : Kn-03-TC10
             When user right clicks on the revision of knative service "nodejs-ex-git-2" to open the context menu
              And user selects "Edit Revision" option from knative revision context menu
              And user clicks on Details tab
             Then details tab displayed with Revision Details and Conditions sections
              And Revision details contains fields like Name, Namespace, Labels, Annotations, Created At, Owner


        @smoke @manual
        Scenario: Update the revision detials : Kn-03-TC11
             When user right clicks on the revision of knative service "nodejs-ex-git-2" to open the context menu
              And user selects "Edit Revision" option from knative revision context menu
              And user modifies the Yaml file of the Revision details page
              And user clicks save button on Revision Yaml page
             Then the message display as "{revision name} has been updated to version {nnnnnn}"
              And another message display as "This object has been updated."


        @regression
        Scenario: Delete revision modal details for service with multiple revisions : Kn-03-TC13
            Given Knative service with multiple revisions
             When user selects "Delete Revision" option from knative revision context menu
             Then modal with "Update the traffic distribution among the remaining Revisions" appears


        @regression
        Scenario: Delete revision for the service which contains multiple revisions : Kn-03-TC14
            Given Knative service with multiple revisions
             When user selects "Delete Revision" option from knative revision context menu
             Then modal with "Update the traffic distribution among the remaining Revisions" appears


        @smoke
        Scenario: Delete Revision not possible for the service which contains one revision : Kn-03-TC12
             When user right clicks on the revision of knative service "nodejs-ex-git-2" to open the context menu
              And user selects "Delete Revision" option from knative revision context menu
             Then user is able to see message "You cannot delete the last Revision for the Service." in modal with header "Unable to delete Revision"
