@knative-serverless
Feature: Custom Domain Mapping Support
              As a user, I would like to have the ability to provide a custom domain for the routes configured for serverless applications.


        Background:
            Given user has installed OpenShift Serverless Operator
              And user has created or selected namespace "aut-eventing-domain"
              And user is at developer perspective
              And user is at Add page


        @smoke
        Scenario Outline: Create knative workload from From Git card and add domain mapping to knative service: KN-07-TC01
            Given user is at Import from git page
             When user enters Git Repo url as "<git_url>"
              And user enters Name as "<workload_name>"
              And user selects resource type as "Serverless Deployment"
              And user clicks on Show advanced Routing options
              And user enters Domain mapping as "<custom_domain>"
              And user clicks on "Create <custom_domain>" in dropdown
              And user clicks create button
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page
              And user clicks on knative workload "<workload_name>"
              And user will see "<custom_domain>" under Domain Mappings of Resources tab on sidebar

        Examples:
                  | git_url                                 | workload_name | custom_domain |
                  | https://github.com/sclorg/golang-ex.git | knative-git   | domain.kn     |


        @regression
        Scenario: Add domain mapping to knative service using edit option: KN-07-TC02
            Given user has created knative service "knative-git"
             When user selects "Edit knative-git" context menu option of knative service "knative-git"
              And user clicks on Show advanced Routing options
              And user enters Domain mapping as "knative.org"
              And user clicks on "Create knative.org" in dropdown
              And user clicks Save button
             Then user will be redirected to Topology page
              And user clicks on knative workload "knative-git"
              And user will see "knative.org" under Domain Mappings of Resources tab on sidebar


        @regression
        Scenario: Edit domain mapping already added to knative service: KN-07-TC03
            Given user can see knative service "knative-git" exist in topology page
             When user selects "Edit knative-git" from actions drop down menu of knative service "knative-git"
              And user clicks on Show advanced Routing options
              And user removes already added custom domain mapping "knative.org" and "domain.kn"
              And user enters Domain mapping as "url.org"
              And user clicks on "Create url.org" in dropdown
              And user clicks Save button
             Then user will be redirected to Topology page
              And user will see "url.org" under Domain Mappings of Resources tab on sidebar



        @regression
        Scenario: Remove already added domain mapping to knative service: KN-07-TC04
            Given user can see knative service "knative-git" exist in topology page
             When user selects "Edit knative-git" context menu option of knative service "knative-git"
              And user clicks on Show advanced Routing options
              And user removes already added custom domain mapping "url.org"
              And user clicks Save button
             Then user will be redirected to Topology page
              And user clicks on knative workload "knative-git"
              And user will not see "url.org" under Domain Mappings of Resources tab on sidebar
