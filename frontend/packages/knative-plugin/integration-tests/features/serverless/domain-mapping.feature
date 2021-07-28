@knative
Feature: Custom Domain Mapping Support
              As a user, I would like to have the ability to provide a custom domain for the routes configured for serverless applications.


        Background:
            Given user has installed OpenShift Serverless Operator
              And user has created Knative Eventing CR
              And user has created Knative Serving CR
              And user has created or selected namespace "aut-eventing-domain"

        
        @smoke @to-do @odc-5030
        Scenario Outline: Create knative workload from From Git card and add domain mapping to knative service: KN-07-TC01
            Given user is at Import from git page
             When user enters Git Repo url as "<git_url>"
              And user enters Name as "<workload_name>"
              And user selects resource type as "Serverless Deployment"
              And user clicks on Show advanced Routing options
              And user creates new custom domain mapping "<custom_domain>"
              And user clicks on "Create <custom_domain>"
              And user clicks Create button
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page
              And user will see "<custom_domain>" under Domain Mappings of Resources tab on sidebar

        Examples:
                  | git_url                                 | workload_name | custom_domain |
                  | https://github.com/sclorg/golang-ex.git | knative-git   | domain.kn     |

        
        @regression @to-do @odc-5030
        Scenario: Add domain mapping to knative service using edit option: KN-07-TC02
            Given user has created knative service "kn-service"
             When user selects "Edit kn-service" context menu option of knative service "kn-service"
              And user clicks on Show advanced Routing options
              And user creates new custom domain mapping "knative.org"
              And user clicks on "Create knative.org"
              And user clicks Save button
             Then user will be redirected to Topology page
              And user will see "knative.org" under Domain Mappings of Resources tab on sidebar

        
        @regression @to-do @odc-5030
        Scenario: Edit domain mapping already added to knative service: KN-07-TC03
            Given user has created knative service "kn-service" with domain mapping "domain.org"
             When user selects "Edit kn-service" from actions drop down menu of knative service "kn-service"
              And user clicks on Show advanced Routing options
              And user removes already added custom domain mapping "domain.org"
              And user creates new custom domain mapping "knative.org"
              And user clicks on "Create knative.org"
              And user clicks Save button
             Then user will be redirected to Topology page
              And user will see "knative.org" under Domain Mappings of Resources tab on sidebar

        
        @regression @to-do @odc-5030
        Scenario: Remove already added domain mapping to knative service: KN-07-TC04
            Given user has created knative service "kn-service" with domain mapping "domain.org"
             When user selects "Edit kn-service" context menu option of knative service "kn-service"
              And user clicks on Show advanced Routing options
              And user removes already added custom domain mapping "domain.org"
              And user clicks Save button
             Then user will be redirected to Topology page
              And user will not see "knative.org" under Domain Mappings of Resources tab on sidebar
