@add-flow
Feature: Upload JAR file
              As a user, I want to upload a JAR file from using Upload JAR file card from Add page

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-upload-jar-file"


        @regression @manual
        Scenario Outline: Upload JAR file from Add options
            Given user is at the Add page
             When user clicks on the Upload JAR file card
              And user clicks on Browse in JAR file section
              And user selects file to upload
              And user selects appropriate Build image version
              And user gives Application name as "sample-upload-app" and workload Name as "<name>"
              And user selects resource type as "<resource_type>"
              And user clicks create button
             Then user will be redirected to Topology page
              And user can see a toast notification of JAR file uploading with link to build logs
              And user can see "<resource_type>" "<name>" in application "sample-upload-app" is created in topology

        Examples:
                  | name                 | resource_type     |
                  | sample-yaml-upload-1 | Deployment        |
                  | sample-yaml-upload-2 | Deployment Config |

        @regression @manual
        Scenario Outline: Upload JAR file through drag and drop from Add options
            Given user is at the Add page
             When user clicks on the Upload JAR file card
              And user drag and drop the file in JAR file section
              And user selects appropriate Build image version
              And user gives Application name as "sample-upload-app" and workload Name as "<name>"
              And user selects resource type as "<resource_type>"
              And user clicks create button
             Then user will be redirected to Topology page
              And user can see a toast notification of JAR file uploading with link to build logs
              And user can see "<resource_type>" "<name>" in application "sample-upload-app" is created in topology

        Examples:
                  | name                 | resource_type     |
                  | sample-yaml-upload-a | Deployment        |
                  | sample-yaml-upload-b | Deployment Config |


        @regression
        Scenario: Upload JAR file with advanced option "Health Checks" : A-04-TC12
             When user is on the Upload JAR file form
              And user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Health Checks" link in Advanced Options section
              And user fills the Readiness Probe details
              And user fills the Liveness Probe details
              And user fills the Startup Probe details
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression
        Scenario: Upload JAR file without application route : A-04-TC05
             When user is on the Upload JAR file form
              And user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user unselects the advanced option Create a route to the application
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And public url is not created for node "sample-yaml-upload" in the workload sidebar


        @regression
        Scenario: Upload JAR file with advanced option "Routing" : A-04-TC06
             When user is on the Upload JAR file form
              And user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Routing" link in Advanced Options section
              And user enters Hostname as "home"
              And user enters Path as "/home"
              And user selects default Target Port
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And the route of application "sample-yaml-upload" contains "home" in the Routes section of the workload sidebar


        @regression
        Scenario: Upload JAR file with advanced option "Deployment" : A-04-TC08
             When user is on the Upload JAR file form
              And user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Deployment" link in Advanced Options section
              And user verify the Auto deploy when new image is available checkbox is selected
              And user enters Name as "home" in Environment Variables Runtime only section
              And user enters Value as "value" in Environment Variables Runtime only section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression
        Scenario: Upload JAR file with advanced option "Resource Limits" : A-04-TC09
             When user is on the Upload JAR file form
              And user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Resource Limits" link in Advanced Options section
              And user enters CPU Request as "10" in CPU section
              And user enters CPU Limits as "12" in CPU section
              And user enters Memory Request as "200" in Memory section
              And user enters Memory Limit as "300" in Memory section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression
        Scenario: Upload JAR file with advanced option "Scaling" : A-04-TC10
             When user is on the Upload JAR file form
              And user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Scaling" link in Advanced Options section
              And user enters number of replicas as "5" in Replicas section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression
        Scenario: Upload JAR file with advanced option "Labels" : A-04-TC11
             When user is on the Upload JAR file form
              And user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Labels" link in Advanced Options section
              And user enters label as "app=frontend"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And verify the label "app=frontend" in side bar of application node "sample-yaml-upload"
