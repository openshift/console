Feature: Perform actions on knative revision
    As a user I want to perform edit or delete operations on knative revision in topology page

Background:
   Given open shift cluster is installed with Serverless operator
   And user is on dev perspective topology page
   And one workload with knative resource is available


@regression, @smoke
Scenario: Knative revision menu options : Kn-03-TC01
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   When user right click on the knative revision
   Then user able to see context menu with options "Edit Labels", "Edit Annotations", "Edit Revision", "Delete Revision"


@regression
Scenario: Edit labels popup details : Kn-03-TC02
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   When user selects "Edit Labels" option from knative revision context menu
   Then popup displays with header name "Edit Labels"
   And save button is disabled


@regression, @smoke
Scenario: Add label to the exisitng labels list : Kn-03-TC03
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   When user selects "Edit Labels" option from knative revision context menu
   And add the label "app=label" to exisitng labels list in "Edit Labels" popup
   And clicks "save" button on the "Edit Labels" popup
   Then the label "app=label" display in side pane details


@regression
Scenario: Remove label from exisitng labels list : Kn-03-TC04
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   When user selects "Edit Labels" option from knative revision context menu
   And removes the label "app=label" from exisitng labels list in "Edit Labels" popup
   And clicks "save" button on the "Edit Labels" popup
   Then the label "app=label" will not display in side pane details


@regression
Scenario: Add labels to exisitng labels list and cancel the activity : Kn-03-TC05
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   When user selects "Edit Labels" option from knative revision context menu
   And add the label "app=label" to exisitng labels list in "Edit Labels" popup
   And clicks "cancel" button on the "Edit Labels" popup
   Then the label "app=label" will not display in side pane details


@regression
Scenario: Edit Annotation popup details : Kn-03-TC06
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   When user selects "Edit Annotaions" option from knative revision context menu
   Then popup displays with header name "Edit Annotaions"
   And key, value columns are displayed with respecitve text fields
   And Add more link is enabled
   And save button is disabled


@regression
Scenario Outline: Add annotation to the exisitng annonations list : Kn-03-TC07
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   And number of annotations are "5" present in side pane details tab
   When user selects "Edit Annotaions" option from knative revision context menu
   And clicks "Add More" button on the "Edit Annotaions" popup
   And types "<key_name>" into the "Key" text box
   And types "<key_value>" into the "value" text box 
   And clicks "save" button on the "Edit Annotaions" popup
   Then number of annotaions increased to "6" in revision side pane details

Examples:
| key_name                    | key_value  |
| serving.knative.dev/creator | kube:admin |


@regression
Scenario Outline: perform cancel action on Edit Annotations : Kn-03-TC09
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   And number of annotations are "6" present in side pane - details tab- annotation section
   When user selects "Edit Annotations" option from knative revision context menu
   And click on "remove" icon for the annotation with key "<key_name>" present in "Edit Annotaions" popup
   And click "cancel" button on the "Edit Annotaions" popup
   Then verify the number of annotaions equal to "6" in side pane details

Examples:
| key_name                    |
| serving.knative.dev/creator |


Scenario Outline: Remove annotation from exisitng annonations list : Kn-03-TC08 
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   And number of annotations are "6" present in side pane - details tab
   When user selects "Edit Annotaions" option from knative revision context menu
   And click on "remove" icon for the annotation with key "<key_name>" present in "Edit Annotaions" popup
   And click "save" button on the "Edit Annotaions" popup
   Then verify the number of annotaions decreased to "5" in side pane details

Examples:
| key_name                    |
| serving.knative.dev/creator |


@regression, @manual
Scenario: Edit revision details page : Kn-03-TC10
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   When user selects "Edit Revision" option from knative revision context menu
   And user clicks on Details tab
   Then details tab displayed with Revision Details and Conditions sections
   And Revision details contains fields like Name, Namespace, Labels, Annotations, Created At, Owner


@regression, @smoke, @manual
Scenario: Update the revision detials : Kn-03-TC11
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   When user selects "Edit Revision" option from knative revision context menu
   And modify the Yaml file of the Revision details page
   And user clicks "save" button on Revision Yaml page
   Then the message display as "{revision name} has been updated to version {nnnnnn}"
   And another message display as "This object has been updated."


@regression
Scenario Outline: Delete revision popup details for service with multiple revisions : Kn-03-TC13
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   And service should contain multiple revisions 
   When user selects "Delete Revision" option from knative revision context menu
   Then popup displayed with message as "Update the traffic distribution among the remaining Revisions"
   And modal should get closed on clicking "OK" button


@regression
Scenario Outline: Delete revision for the service which contains multiple revisions : Kn-03-TC14


@regression, @smoke
Scenario: Delete Revision not possible for the service which contains one revision : Kn-03-TC12
   Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
   When user selects "Delete Revision" option from knative revision context menu
   Then popup displayed with header name "Unable to delete revision" and message as "You cannot delete the last Revision for the Service."
   And modal should get closed on clicking "OK" button
