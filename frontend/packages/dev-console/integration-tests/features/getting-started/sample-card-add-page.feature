@getting-started @dev-console
Feature: Create Sample Application
              As a user I want to create the Sample Application from +Add page

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-addflow-catalog"

        @regression
        Scenario: Sample Card in Add flow: GS-03-TC01
            Given user is at Add page
             When user clicks on the "View all samples" link
             Then user is redirected to Samples Page
              And user is able to see different sample applications
              And sample applications are based on the builder images

        @regression @odc-7128
        Scenario Outline: Create Sample Application from Add page: GS-03-TC05
            Given user is at Add page
             When user clicks on the Samples card
              And user selects "<card_name>" sample from Samples
              And user is able to see the form header name as "<form_header>"
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page list view
              
        Examples:
                  | card_name | form_header               | workload_name |
                  | Httpd     | Create Sample application | httpd-sample  |
                  | Basic Go  | Import from Git           | go-basic      |

        @regression
        Scenario: Review Sample Appliation form: GS-03-TC02
            Given user is at Add page
             When user clicks on the "View all samples" link
              And user is redirected to Samples Page
              And user selects "Go" sample from Samples
              And user is able to see the form header name as "Create Sample application"
             Then form is filled with default values
              And user will see the name section
              And user will see builder image version dropdown
              And user will see builder image below builder image version dropdown
              And user will see git url is ineditable field
              And user will see create and cancel button
            
        @regression
        Scenario: Edit Sample Appliation form: GS-03-TC03
            Given user is in Add flow of dev perspective
             When user clicks on the "View all samples" link
             Then user is redirected to Samples Page
              And user clicks on the "Go" card
              And user is able to see the form header name as "Create Sample application"
              And user assign a new name as "golang-sample-app1" in the name section
              And user changes the builder image version from dropdown to "latest"
              And user clicks on the Create button
              And user is taken to topology with a "golang-sample-app1" deployment workload created inside sample application

        @regression
        Scenario: Create Basic NodeJS Devfile Sample Appliation: GS-03-TC04
            Given user is at Samples page
             When user clicks on the "Basic Node.js" card
              And user assigns a name "node-js-basic-sample1" in the Name section of Import from Devfile form
              And user clicks on the Create button
             Then user is taken to Topology page with deployment workload "node-js-basic-sample1" created