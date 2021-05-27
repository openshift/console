@add-flow
Feature: Create Application from Container image file
              As a user, I want to create the application, component or service from Add Flow Container image

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-addflow-containerimage"
              And user is at Add page


        @regression
        Scenario: Deploy image page details on entering external registry image name: A-02-TC01
            Given user is at Deploy Image page
             When user enters Image name from external registry as "openshift/hello-openshift"
             Then user can see the image name gets Validated
              And Application name displays as "hello-openshift-app"
              And Name displays as "hello-openshift"
              And advanced option Create a route to the application is selected


        @regression
        Scenario Outline: Deploy <image> image with Runtime icon from external registry: A-02-TC02
            Given user is at Deploy Image page
             When user enters Image name from external registry as "<image_name>"
              And user selects the "<runtime_icon>" from Runtime Icon dropdown
              And user selects the application "sample-app" from Application dropdown
              And user enters Name as "<name>"
              And user selects resource type as "deployment"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user will see the deployed image "<name>" with "<runtime_icon>" icon

        Examples:
                  | image  | image_name                | runtime_icon | name         |
                  | secure | openshift/hello-openshift | fedora       | hello-secure |
                #   | insecure | <identify insecure image> | ansible      | hello-insecure |


        @smoke
        Scenario Outline: Deploy image with Runtime icon from internal registry: A-02-TC03
            Given user is at Deploy Image page
             When user selects Image stream tag from internal registry
              And user selects Project as "openshift" from internal registry
              And user selects Image Stream as "<image_stream>" from internal registry
              And user selects tag as "latest" from internal registry
              And user selects the "<runtime_icon>" from Runtime Icon dropdown
              And user selects the application "sample-app" from Application dropdown
              And user enters Name as "<name>"
              And user selects resource type as "deployment"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user will see the deployed image "<name>" with "<runtime_icon>" icon

        Examples:
                  | image_stream | runtime_icon | name           |
                  | golang       | fedora       | hello-internal |


        @regression
        Scenario: Perform cancel operation on Container image form: A-02-TC04
            Given user is at Deploy Image page
             When user selects Image stream tag from internal registry
              And user selects Project as "openshift" from internal registry
              And user selects Image Stream as "golang" from internal registry
              And user selects tag as "latest" from internal registry
              And user clicks Cancel button on Deploy Image page
             Then user will be redirected to Add page


        @regression
        Scenario: Edit Runtime Icon while Editing Image: A-02-TC05
            Given user has deployed container Image "openshift/hello-openshift" from external registry
              And user is at Topology page
              And topology page has a deployed image "hello-openshift" with Runtime Icon "fedora"
             When user right clicks on the node "hello-openshift" to open context menu
              And user selects Edit imagename "hello-openshift" option
              And user updates the Runtime icon to "ansible"
              And user clicks on Save button
             Then user will be redirected to Topology page
              And user will see the deployment image "hello-openshift" icon updated to "ansible" Icon
