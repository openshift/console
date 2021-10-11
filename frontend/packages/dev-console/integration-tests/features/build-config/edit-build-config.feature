Feature: Form based edit for Build Configs
              As a user, I can have form based edit for Build Configs to improve the user experience.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-form-edit-build-config"


        @smoke @to-do
        Scenario: Edit Build Config page: EBC-01-TC01
            Given user has created a deployment workload "nodejs-ex-git1"
             When user navigates to build tab
              And user clicks on kebab menu for "nodejs-ex-git1" build config
              And user clicks on Edit BuildConfig
             Then user will see the Name field
              And user will see the Git repository url field
              And user will see the Image configuration section
              And user will see the Environment Variables section


        @regression @to-do
        Scenario: Advanced options in Edit Build Config page: EBC-01-TC02
            Given user is at Edit Build Config page of deployment "nodejs-ex-git1"
             When user clicks on Advanced option "Triggers"
              And user clicks on Advanced option "Secrets"
              And user clicks on Advanced option "Run Policy"
              And user clicks on Advanced option "Hooks"
             Then user will see section "Triggers"
              And user will see section "Build Secret"
              And user will see section "Run Policy"
              And user will see section "Hooks"


        @regression @manual
        Scenario: Switch from Form to YAML view for editing BuildConfig: EBC-01-TC03
            Given user is at Edit Build Config page of deployment "nodejs-ex-git1"
             When user switches to YAML view
              And user changes spec.output.to.name to "nodejs-ex-git:2.0"
              And user switches to Form view
             Then user will see tag in Push to value as "nodejs-ex-git:2.0"


        @regression @to-do
        Scenario Outline: Edit a buildconfig which uses strategy Source(S2I)) and Git as source: EBC-01-TC04
            Given user is at Edit Build Config page of deployment "nodejs-ex-git1"
             When user changes Git Rpository URL to "<git_url>" menu of build config
              And user selects imagestream "<image_stream>" and tag "<tag>" in Build From section in Image Configuration
              And user enters Name and Value as "<name>" and "<value>" respectively in Environment Variables
              And user clicks Save button on Edit build Config page
             Then user will see Git Repository as "<git_url>" and Build from as "<image_stream>:<tag>"

        Examples:
                  | git_url                                 | image_stream | tag | name | value |
                  | https://github.com/sclorg/django-ex.git | python       | 3.8 | path | /home |


        @regression @to-do
        Scenario: Edit Advanced git options of buildconfig which uses strategy Docker and Git as source: EBC-01-TC05
        # user can use buildconfig-with-strategy-docker-source-git.yaml from testData/yamls/BuildConfig
            Given user has applied the yaml "buildconfig-with-strategy-docker-source-git.yaml"
             When user clicks on action menu of build config
              And user selects the option Edit BuildConfig
              And user clicks Show advanced Git options
              And user changes value of Context Dir to "beginner/static-site"
              And user clicks Save button on Edit Build Config page
             Then user will see Context dir as "beginner/static-site"


        @regression @to-do
        Scenario Outline: Edit a buildconfig which uses strategy Docker and Dockerfile as source: EBC-01-TC06
        # user can use buildconfig-with-strategy-docker-source-dockerfile.yaml from testData/yamls/BuildConfig
            Given user has applied the yaml "buildconfig-with-strategy-docker-source-dockerfile.yaml"
             When user clicks on action menu of build config
              And user selects the option Edit BuildConfig
              And user enters Name and Value as "<name>" and "<value>" respectively in Environment Variables
              And user clicks Save button on Edit build Config page
              And user goes to Environment tab
             Then user will see Name as "<name>" and and Value as "<value>" in Environment Variables

        Examples:
                  | name | value |
                  | path | /home |


        @regression @to-do
        Scenario Outline: Edit a buildconfig which uses strategy Source and Binary as source: EBC-01-TC07
        # user can use buildconfig-with-strategy-source-source-binary.yaml from testData/yamls/BuildConfig
            Given user has applied the yaml "buildconfig-with-strategy-source-source-binary.yaml"
             When user clicks on action menu of build config
              And user selects the option Edit BuildConfig
              And user enters Name and Value as "<name>" and "<value>" respectively in Environment Variables
              And user clicks Save button on Edit build Config page
              And user goes to Environment tab
             Then user will see Name as "<name>" and and Value as "<value>" in Environment Variables

        Examples:
                  | name | value |
                  | path | /home |
