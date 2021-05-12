@add-flow
Feature: Upload JAR file
              As a user, I want to upload a JAR file from using Upload JAR file card from Add page

        Background:
            Given user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-upload-jar-file"


        @smoke
        Scenario: Upload Jar file page details: A-10-TC01
            Given user is at Add page
             When user clicks on the Upload JAR file card
             Then user is able to see Upload jar file, Optional java commands, Run time Icon and Builder Image version fields displayed in JAR section
              And Application Name, Name fields displayed in General section
              And Resources section, Advanced options sections are displayed
              And Create button is in disabled state


        @regression @to-do
        Scenario Outline: Upload JAR file from Add options: A-10-TC02
            Given user is at Add page
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


        @regression @to-do
        Scenario Outline: Upload JAR file through drag and drop from Add options: A-10-TC03
            Given user is at Add page
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


        @regression @to-do
        Scenario: Upload JAR file with advanced option "Health Checks": A-10-TC04
            Given user is at Upload JAR file form
             When user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Health Checks" link in Advanced Options section
              And user fills the Readiness Probe details
              And user fills the Liveness Probe details
              And user fills the Startup Probe details
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression @to-do
        Scenario: Upload JAR file without application route: A-10-TC05
            Given user is at Upload JAR file form
             When user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user unselects the advanced option Create a route to the application
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And public url is not created for node "sample-yaml-upload" in the workload sidebar


        @regression @to-do
        Scenario: Upload JAR file with advanced option "Routing": A-10-TC06
            Given user is at Upload JAR file form
             When user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Routing" link in Advanced Options section
              And user enters Hostname as "home"
              And user enters Path as "/home"
              And user selects default Target Port
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And the route of application "sample-yaml-upload" contains "home" in the Routes section of the workload sidebar


        @regression @to-do
        Scenario: Upload JAR file with advanced option "Deployment": A-10-TC07
            Given user is at Upload JAR file form
             When user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Deployment" link in Advanced Options section
              And user verify the Auto deploy when new image is available checkbox is selected
              And user enters Name as "home" in Environment Variables Runtime only section
              And user enters Value as "value" in Environment Variables Runtime only section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression @to-do
        Scenario: Upload JAR file with advanced option "Resource Limits": A-10-TC08
            Given user is at Upload JAR file form
             When user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Resource Limits" link in Advanced Options section
              And user enters CPU Request as "10" in CPU section
              And user enters CPU Limits as "12" in CPU section
              And user enters Memory Request as "200" in Memory section
              And user enters Memory Limit as "300" in Memory section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression @to-do
        Scenario: Upload JAR file with advanced option "Scaling": A-10-TC09
            Given user is at Upload JAR file form
             When user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Scaling" link in Advanced Options section
              And user enters number of replicas as "5" in Replicas section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression @to-do
        Scenario: Upload JAR file with advanced option "Labels": A-10-TC10
            Given user is at Upload JAR file form
             When user clicks on Browse in JAR file section
              And user selects file to upload
              And user gives Application name as "sample-upload-app" and workload Name as "sample-yaml-upload"
              And user clicks "Labels" link in Advanced Options section
              And user enters label as "app=frontend"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And verify the label "app=frontend" in side bar of application node "sample-yaml-upload"
