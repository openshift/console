@add-flow
Feature: Create Application from git form
              As a user, I want to create the application, component or service from Add options

        Background:
            Given user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-addflow-git"


        @smoke
        Scenario Outline: Add new git workload with new application for resoruce type "<resource_type>": A-06-TC01
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user enters Application name as "dancer-ex-git-app"
              And user enters Name as "<name>"
              And user selects resource type as "<resource_type>"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<name>" in topology page

        Examples:
                  | name            | resource_type     |
                  | dancer-ex-git   | Deployment        |
                  | dancer-ex-git-1 | Deployment Config |


        @regression
        Scenario: Add new git workload to the existing application: A-06-TC02
            Given user has created workload "exist-git" with resource type "Deployment"
              And user is at Add page
              And user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user enters Application name as "nodejs-ex-git-app"
              And user enters Name as "dancer-ex-git-2"
              And user selects resource type as "Deployment Config"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user can see the created workload "dancer-ex-git-2" is linked to existing application "nodejs-ex-git-app"


        @regression
        Scenario: Cancel the git workload creation: A-06-TC03
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user clicks Cancel button on Add page
             Then user will be redirected to Add page


        @regression
        Scenario: Create workload without application route: A-06-TC04
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user enters Application name as "app-no-route"
              And user enters Name as "name-no-route"
              And user unselects the advanced option Create a route to the application
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And public url is not created for node "name-no-route" in the workload sidebar


        @regression
        Scenario: Create a git workload with advanced option "Routing": A-06-TC05
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user enters name as "git-route" in General section
              And user clicks "Routing" link in Advanced Options section
              And user enters Hostname as "home"
              And user enters Path as "/home"
              And user selects default Target Port
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And the route of application "git-route" contains "home" in the Routes section of the workload sidebar


        @regression
        Scenario: Create the workload by unselecting options in "Build Configuration" section:: A-06-TC06
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
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
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user enters name as "git-deploy" in General section
              And user clicks "Deployment" link in Advanced Options section
              And user verify the Auto deploy when new image is available checkbox is selected
              And user enters Name as "home" in Environment Variables Runtime only section
              And user enters Value as "value" in Environment Variables Runtime only section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression
        Scenario: Create a git workload with advanced option "Resource Limits": A-06-TC08
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user enters name as "git-resource" in General section
              And user clicks "Resource limits" link in Advanced Options section
              And user enters CPU Request as "10" in CPU section
              And user enters CPU Limits as "12" in CPU section
              And user enters Memory Request as "200" in Memory section
              And user enters Memory Limit as "300" in Memory section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression
        Scenario: Create a git workload with advanced option "Scaling": A-06-TC09
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user enters name as "git-scaling" in General section
              And user clicks "Scaling" link in Advanced Options section
              And user enters number of replicas as "5" in Replicas section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        @regression
        Scenario: Create a git workload with advanced option "Labels": A-06-TC10
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user enters name as "git-labels" in General section
              And user clicks "Labels" link in Advanced Options section
              And user enters label as "app=frontend"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And verify the label "app=frontend" in side bar of application node "git-labels"


        @regression
        Scenario: Create a git workload with advanced option "Health Checks": A-06-TC11
            Given user is at Import from git page
             When user enters Git Repo url as "https://github.com/sclorg/dancer-ex.git"
              And user enters name as "git-healthchecks" in General section
              And user clicks "Health checks" link in Advanced Options section
              And user fills the Readiness Probe details
              And user fills the Liveness Probe details
              And user fills the Startup Probe details
              And user clicks Create button on Add page
             Then user will be redirected to Topology page


        # Marking this scenario as @manual, because due to git-rate limit issue, below scenarios are failing
        @manual
        Scenario Outline: Builder iamge detected for git url "<git_url>": A-06-TC12
            Given user is at Import from git page
             When user enters Git Repo url as "<git_url>"
             Then git url gets Validated
              And builder image is detected
              And builder image version drop down is displayed
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
