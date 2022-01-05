@add-flow
Feature: Create Application from git form
              As a user, I want to create the application, component or service from Add options

        Background:
            Given user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-addflow-git"


        # @smoke
        # Marking this scenario as @manual, because due to git-rate limit issue, below scenarios are failing
        # TODO: Use Cypress HTTP mocking to solve the github rate limiting issue. See - https://docs.cypress.io/guides/guides/network-requests
        @regression @manual @odc-6266
        Scenario Outline: Add new git workload with new application for resoruce type "<resource_type>": A-06-TC01
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user enters Application name as "dancer-ex-git-app"
              And user enters Name as "<name>"
              And user selects resource type as "<resource_type>"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user can see toast notification saying "Deployment created successfully"
              And user is able to see workload "<name>" in topology page

        Examples:
                  | name         | resource_type     |
                  | import-git   | Deployment        |
                  | import-git-1 | Deployment Config |


        @regression @odc-6266
        Scenario: Add new git workload to the existing application: A-06-TC02
            Given user has created workload "exist-git" with resource type "Deployment"
              And user is at Add page
              And user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user enters Application name as "nodejs-ex-git-app"
              And user enters Name as "dancer-ex-git-2"
              And user selects resource type as "Deployment Config"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user can see toast notification saying "Deployment created successfully"
              And user can see the created workload "dancer-ex-git-2" is linked to existing application "nodejs-ex-git-app"


        @regression
        Scenario: Cancel the git workload creation: A-06-TC03
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user clicks Cancel button on Add page
             Then user will be redirected to Add page


        @regression
        Scenario: Create workload without application route: A-06-TC04
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user enters Application name as "app-no-route"
              And user enters Name as "name-no-route"
              And user unselects the advanced option Create a route to the application
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And public url is not created for node "name-no-route" in the workload sidebar


        @regression @odc-6266
        Scenario: Create a git workload with advanced option "Routing": A-06-TC05
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user enters name as "git-route" in General section
              And user clicks "Show advanced Routing options" link in Advanced Options section
              And user enters "route=testRoute1" in Additional Route labels section
              And user enters Hostname as "home"
              And user enters Path as "/home"
              And user selects default Target Port
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user can see the toast notification containg the route value "home"
              And the route of application "git-route" contains "home" in the Routes section of the workload sidebar
              And user is able to see label "route=testRoute1" in Route details page for deployment "git-route"


        @regression
        Scenario: Create the workload by unselecting options in "Build Configuration" section:: A-06-TC06
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user enters name as "git-build" in General section
              And user clicks "Build configuration" link in Advanced Options section
              And user unselects Configure a webhook build trigger checkbox in build configuration section
              And user unselects Automatically build a new image when the builder image changes checkbox in build configuration section
              And user unselects Launch the first build when the build configuration is created checkbox in build configuration section
              And user enters Name as "home" in Environment Variables section
              And user enters Value as "value" in Environment Variables section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And build does not get started for "git-build"


        @regression
        Scenario: Create a git workload with advanced option "Deployment": A-06-TC07
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user enters Name as "git-deploy" in General section
              And user clicks "Deployment" link in Advanced Options section
              And user verify the Auto deploy when new image is available checkbox is selected
              And user enters Name as "home" in Environment Variables Runtime only section
              And user enters Value as "value" in Environment Variables Runtime only section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression
        Scenario: Create a git workload with advanced option "Resource Limits": A-06-TC08
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user enters Name as "git-resource" in General section
              And user clicks "Resource limits" link in Advanced Options section
              And user enters CPU Request as "10" in CPU section
              And user enters CPU Limits as "12" in CPU section
              And user enters Memory Request as "200" in Memory section
              And user enters Memory Limit as "300" in Memory section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression
        Scenario: Create a git workload with advanced option "Scaling": A-06-TC09
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user enters Name as "git-scaling" in General section
              And user clicks "Scaling" link in Advanced Options section
              And user enters number of replicas as "5" in Replicas section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression
        Scenario: Create a git workload with advanced option "Labels": A-06-TC10
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user enters Name as "git-labels" in General section
              And user clicks "Labels" link in Advanced Options section
              And user enters label as "app=frontend"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And verify the label "app=frontend" in side bar of application node "git-labels"


        @regression
        Scenario: Create a git workload with advanced option "Health Checks": A-06-TC11
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/dancer-ex.git"
              And user enters Name as "git-healthchecks" in General section
              And user clicks "Health checks" link in Advanced Options section
              And user fills the Readiness Probe details
              And user fills the Liveness Probe details
              And user fills the Startup Probe details
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        # Marking this scenario as @manual, because due to git-rate limit issue, below scenarios are failing
        @regression @manual
        Scenario Outline: Builder image detected for git url "<git_url>": A-06-TC12
            Given user is at Import from Git form
             When user enters Git Repo URL as "<git_url>"
             Then git url "<git_url>" gets Validated
              And builder image is detected
              And Application name displays as "<app_name>"
              And Name displays as "<name>"

        Examples:
                  | git_url                                        | app_name           | name                  |
                  | https://github.com/sclorg/dancer-ex.git        | dancer-ex-git-app  | dancer-ex-git         |
                  | https://github.com/sclorg/cakephp-ex.git       | cakephp-ex-git-app | cakephp-ex-git        |
                  | https://github.com/sclorg/golang-ex.git        | golang-ex-git-app  | golang-ex-git         |
                  | https://github.com/sclorg/ruby-ex.git          | ruby-ex-git-app    | ruby-ex-git           |
                  | https://github.com/sclorg/django-ex.git        | django-ex-git-app  | django-ex-git         |
                  | https://github.com/spring-projects/spring-boot | spring-bottom-app  | openshift-quickstarts |
                  | https://github.com/sclorg/nodejs-ex.git        | nodejs-ex-git-app  | nodejs-ex-git         |


        @regression @manual
        Scenario Outline: Dotnet Builder image detection for git url "<git_url>": A-06-TC13
            Given user is at Import from Git form
             When user enters Git Repo URL as "<git_url>"
              And warning message "Unable to detect import strategy" displays
              And user clicks on "Show advanced Git options" link
              And user clears Context dir field
              And user enters Context dir as "<dir_name>"
             Then git url "<git_url>" gets Validated
              And user is able to see "Builder Image(s) selected" message

        Examples:
                  | git_url                                                   | dir_name |
                  | https://github.com/redhat-developer/s2i-dotnetcore-ex.git | /app     |


        @regression @manual
        Scenario Outline: "Unable to detect the builder image" warning message displays for server related git urls: A-06-TC14
            Given user is at Import from Git form
             When user enters Git Repo URL as "<git_url>"
             Then git url "<git_url>" gets Validated
              And user is able to see warning message "Unable to detect Import strategy"

        Examples:
                  | git_url                                |
                  | https://github.com/sclorg/httpd-ex.git |
                  | https://github.com/sclorg/nginx-ex.git |


        @regression
        Scenario: Provide custom build environments for nodejs git import
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/nodejs-ex"
              And user enters run command for "NPM_RUN" as "build1"
              And user enters Name as "nodejs-env"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to navigate to Build "nodejs-env-1" for deployment "nodejs-env"
              And see environment variable "NPM_RUN" with value "build1" in Environment tab of details page


        @regression
        Scenario: Update custom build environment in nodejs application edit page
            Given user is at Topology page
             When user edits the application "nodejs-env"
              And user enters run command for "NPM_RUN" as "build2"
              And user clicks Create button on Add page
              And user clicks on workload "nodejs-env"
              And user starts a new build
              And user navigates to Topology page
             Then user is able to navigate to Build "nodejs-env-2" for deployment "nodejs-env"
              And see environment variable "NPM_RUN" with value "build2" in Environment tab of details page


        @regression @odc-6303
        Scenario: Checking Secure Route option in import form: A-06-TC05
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/sclorg/nodejs-ex.git"
              And user enters name as "nodejs-route" in General section
              And user clicks "Show advanced Routing options" link in Advanced Options section
             Then user is able to see Secure Route checkbox is checked
              And user is able to see Edge value is selected in "TLS termination"
              And user is able to see Redirect value is selected in "Insecure traffic"


