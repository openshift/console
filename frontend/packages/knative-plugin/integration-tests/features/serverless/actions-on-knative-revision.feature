@knative-serverless @knative
Feature: Perform actions on knative revision
              As a user, I want to perform edit or delete operations on knative revision in topology page

        Background:
            Given user has created or selected namespace "aut-knative-revision"
              And user is at Topology page


        @pre-condition
        Scenario Outline: Create knative workload from From Git card on Add page: KN-05-TC04
            Given user is at Add page
          #     And user is at Import from Git page
              And user selects Import from Git from quick create
             When user enters Git Repo url as "<git_url>"
              And user enters Name as "<workload_name>"
              And user selects resource type as "Serverless Deployment"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page
              And user is able to see Knative Revision

        Examples:
                  | git_url                                 | workload_name   |
                  | https://github.com/sclorg/nodejs-ex.git | nodejs-ex-git-1 |


        @smoke
        Scenario: Context menu for knative Revision: KN-01-TC01
             When user right clicks on the revision of knative service "nodejs-ex-git-1" to open the context menu
             Then user is able to see Edit Labels, Edit Annotations, Edit Revision, Delete Revision options in context menu


        @regression
        Scenario: Add new label to knative Revision: KN-01-TC02
             When user right clicks on the revision of knative service "nodejs-ex-git-1" to open the context menu
              And user selects "Edit labels" option from knative revision context menu
              And user adds the label "app=label" to existing labels list in Edit Labels modal
              And user clicks on Save button
             Then user can see the label "app=label" in the Details tab of the Sidebar of "nodejs-ex-git-1"


        @regression
        Scenario: Remove label from knative Revision: KN-01-TC03
             When user right clicks on the revision of knative service "nodejs-ex-git-1" to open the context menu
              And user selects "Edit labels" option from knative revision context menu
              And user removes the label "app=label" from existing labels list in "Edit labels" modal
              And user clicks on Save button
             Then user will not see the label "app=label" in the Details tab of the Sidebar of "nodejs-ex-git-1"


        @regression
        Scenario: Add labels to existing labels list and cancel the activity: KN-01-TC04
             When user right clicks on the revision of knative service "nodejs-ex-git-1" to open the context menu
              And user selects "Edit labels" option from knative revision context menu
              And user adds the label "app=label" to existing labels list in Edit Labels modal
              And user clicks cancel button on the "Edit labels" modal
             Then user will not see the label "app=label" in the Details tab of the Sidebar of "nodejs-ex-git-1"


        @regression
        Scenario: Add annotation to the existing annonations list: KN-01-TC05
            Given Revision of Knative service "nodejs-ex-git-1" consists of annotations in topology side bar
             When user right clicks on the revision of knative service "nodejs-ex-git-1" to open the context menu
              And user selects "Edit annotations" option from knative revision context menu
              And user clicks Add button on the Edit Annotations modal
              And user enters annotation key as "new-annotation"
              And user enters annotation value as "new-pw"
              And user clicks the save button on the "Edit annotations" modal
             Then verify the number of annotations equal to "7" in side bar details knative revision


        @regression
        Scenario: perform cancel action on Edit Annotations: KN-01-TC06
            Given number of annotations are "7" present in revision side bar details of service "nodejs-ex-git-1"
             When user right clicks on the revision of knative service "nodejs-ex-git-1" to open the context menu
              And user selects "Edit annotations" option from knative revision context menu
              And user clicks on "remove" icon for the annotation with key "new-annotation"
              And user clicks cancel button on the "Edit annotations" modal
             Then verify the number of annotations equal to "7" in side bar details knative revision


        @regression
        Scenario Outline: Remove annotation from existing annonations list: KN-01-TC07
            Given number of annotations are "7" present in revision side bar details of service "nodejs-ex-git-1"
             When user right clicks on the revision of knative service "nodejs-ex-git-1" to open the context menu
              And user selects "Edit annotations" option from knative revision context menu
              And user clicks on "remove" icon for the annotation with key "<key_name>"
              And user clicks the save button on the "Edit annotations" modal
             Then verify the number of annotations equal to "6" in side bar details knative revision

        Examples:
                  | key_name       |
                  | new-annotation |


        @regression @manual
        Scenario: Edit revision details page: KN-01-TC08
             When user right clicks on the revision of knative service "nodejs-ex-git-1" to open the context menu
              And user selects "Edit Revision" option from knative revision context menu
              And user clicks on Details tab
             Then details tab displayed with Revision Details and Conditions sections
              And Revision details contains fields like Name, Namespace, Labels, Annotations, Created At, Owner


        @smoke @manual
        Scenario: Update the revision detials: KN-01-TC09
             When user right clicks on the revision of knative service "nodejs-ex-git-1" to open the context menu
              And user selects "Edit Revision" option from knative revision context menu
              And user modifies the Yaml file of the Revision details page
              And user clicks save button on Revision Yaml page
             Then the message display as "{revision name} has been updated to version {nnnnnn}"
              And another message display as "This object has been updated."


        @smoke
        Scenario: Delete Revision not possible for the service which contains one revision: KN-01-TC10
             When user right clicks on the revision of knative service "nodejs-ex-git-1" to open the context menu
              And user selects "Delete Revision" option from knative revision context menu
             Then user is able to see message "You cannot delete the last Revision for the Service." in modal with header "Unable to delete Revision"


        @regression
        Scenario: Delete revision modal details for service with multiple revisions: KN-01-TC11
            Given knative service "nodejs-ex-git-1" with multiple revisions
             When user selects "Delete Revision" option from knative revision context menu of knative service "nodejs-ex-git-1"
             Then modal with "Delete Revision?" appears
