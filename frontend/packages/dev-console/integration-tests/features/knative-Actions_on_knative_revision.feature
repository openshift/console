Feature: Perform actions on knative revision
    As a user I want to perform edit or delete operations on knative revision in topology page

Background:
   Given open shift cluster is installed with Serverless operator
   And user is on dev perspective topology page
   And at least one workload with knative type resource should be available


@regression, @smoke
Scenario Outline: Verify the knative revision context menu options
   Given searched results are displayed with knative revision name "<knative_revision_name>" on topology page
   When user right click on the knative revision
   Then user should able to see context menu with "<number_of_context_menu_options>" options
   And context menu should contain "Edit Labels", "Edit Annotations", "Edit Revision", "Delete Revision"

Examples:
| knative_revision_name  | number_of_context_menu_options |
| nodejs-ex-git-1-q5rb8  | 4                              |


@regression
Scenario Outline: Add label to the exisitng labels list
   Given searched results are displayed with knative revision name "<knative_revision_name>" on topology page
   When user selects "<context_menu_option>" option from knative revision context menu
   And add the label "<label_name>" to exisitng labels list in "Edit Labels" popup
   And click "save" button on the "Edit Labels" popup
   Then the label "<label_name>" should display in side pane details

Examples:
| knative_revision_name  | context_menu_option | label_name |
| nodejs-ex-git-1-q5rb8  | Edit Labels         | app=label  |


@regression
Scenario Outline: Remove label from exisitng labels list
   Given searched results are displayed with knative revision name "<knative_revision_name>" on topology page
   When user selects "<context_menu_option>" option from knative revision context menu
   And remove the label "<label_name>" to exisitng labels list in "Edit Labels" popup
   And click "save" button on the "Edit Labels" popup
   Then the label "<label_name>" should not display in side pane details

Examples:
| knative_revision_name  | context_menu_option | label_name |
| nodejs-ex-git-1-q5rb8  | Edit Labels         | app=label  |


@regression
Scenario Outline: perform cancel action on Edit Labels
   Given searched results are displayed with knative revision name "<knative_revision_name>" on topology page
   When user selects "<context_menu_option>" option from knative revision context menu
   And add the label "<label_name>" to exisitng labels list in "Edit Labels" popup
   And click "cancel" button on the "Edit Labels" popup
   Then the label "<label_name>" should not display in side pane details

Examples:
| knative_revision_name  | context_menu_option | label_name |
| nodejs-ex-git-1-q5rb8  | Edit Labels         | app=label  |


@regression
Scenario Outline: Add annotation to the exisitng annonations list
   Given searched results are displayed with knative revision name "<knative_revision_name>" on topology page
   And number of annotations are "5" present in side pane details tab
   When user selects "<context_menu_option>" option from knative revision context menu
   And click "Add More" button on the "Edit Annotaions" popup
   And type "<key_name>" into the "Key" text box
   And type "<key_value>" into the "value" text box 
   And click "save" button on the "Edit Annotaions" popup
   Then verify the number of annotaions increased to "6" in side pane details

Examples:
| knative_revision_name  | context_menu_option | key_name                    | key_value  |
| nodejs-ex-git-1-q5rb8  | Edit Annotaions     | serving.knative.dev/creator | kube:admin |


@regression
Scenario Outline: perform cancel action on Edit Annotations
   Given searched results are displayed with knative revision name "<knative_revision_name>" on topology page
   And number of annotations are "6" present in side pane - details tab- annotation section
   When user selects "<context_menu_option>" option from knative revision context menu
   And click on "remove" icon for the annotation with key "<key_name>" present in "Edit Annotaions" popup
   And click "cancel" button on the "Edit Annotaions" popup
   Then verify the number of annotaions equal to "6" in side pane details

Examples:
| knative_revision_name  | context_menu_option | key_name                    |
| nodejs-ex-git-1-q5rb8  | Edit Annotaions     | serving.knative.dev/creator |


Scenario Outline: Remove annotation from exisitng annonations list
   Given searched results are displayed with knative revision name "<knative_revision_name>" on topology page
   And number of annotations are "6" present in side pane - details tab
   When user selects "<context_menu_option>" option from knative revision context menu
   And click on "remove" icon for the annotation with key "<key_name>" present in "Edit Annotaions" popup
   And click "save" button on the "Edit Annotaions" popup
   Then verify the number of annotaions decreased to "5" in side pane details

Examples:
| knative_revision_name  | context_menu_option | key_name                    |
| nodejs-ex-git-1-q5rb8  | Edit Annotaions     | serving.knative.dev/creator |


@regression
Scenario Outline: Edit revision
   Given searched results are displayed with knative revision name "<knative_revision_name>" on topology page
   When user selects "<context_menu_option>" option from knative revision context menu
   And modify the Yaml file of the Revision details page
   And click "save" button on Revision Yaml page
   Then message should display as "{revision name} has been updated to version {nnnnnn}"
   And another message should display as "This object has been updated."

Examples:
| knative_revision_name  | context_menu_option |
| nodejs-ex-git-1-q5rb8  | Edit Revision       |


@regression
Scenario Outline: Delete revision from service with multiple revisions [TBD]
   Given searched results are displayed with knative revision name "<knative_revision_name>" on topology page
   And service should contain multiple revisions 
   When user selects "<context_menu_option>" option from knative revision context menu
   Then popup displayed with message as "Update the traffic distribution among the remaining Revisions"
   And modal should get closed on clicking "OK" button

Examples:
| knative_revision_name  | context_menu_option |
| nodejs-ex-git-1-q5rb8  | Delete Revision     |


@regression
Scenario Outline: Delete revision from service with one revision
   Given searched results are displayed with knative revision name "<knative_revision_name>" on topology page
   And service should contain only one revision
   When user selects "<context_menu_option>" option from knative revision context menu
   Then popup displayed with header name "Unable to delete revision" and message as "You cannot delete the last Revision for the Service."
   And modal should get closed on clicking "OK" button

Examples:
| knative_revision_name  | context_menu_option |
| nodejs-ex-git-1-q5rb8  | Delete Revision     |
