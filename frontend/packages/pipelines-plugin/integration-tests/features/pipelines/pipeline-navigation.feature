@pipelines
Feature: Perform the actions on Pipelines page
              As a user, I want to navigate through the Pipeline pages in dev perspective

        Background:
            Given user has created or selected namespace "aut-pipelines-nav"
             And user is at pipelines page

        @regression @odc-7131
        Scenario: Remember last visited tab for the Pipeline page: P-12-TC01
             When user navigates to Repositories page
              And user navigates to Builds page
              And user navigates to Pipelines page
             Then user will be redirected to the repositories page

        @regression @odc-7131
        Scenario: user will be redirect to Repository details page Details tab if user coming from the create repository flow: P-12-TC02
             When user click on create repository button
              And user will redirects to Add Git Repository page
              And user enter the GitRepo URL "https://github.com/vikram-raj/hello-func"
              And user enters the name "git-hello-func"
              And user clicks on add button
             Then user will be redirected to Git Repository added page
              And user clicks on close button
              And user will be redirected to Repository details page with header name "git-hello-func"

        @regression @odc-7131
        Scenario: Default tab for respository details page is PipelineRuns if user is not coming from the create repository flow: P-12-TC03
            Given repository "git-hello-func" is present on the Repositories page
             When user searches repository "git-hello-func" in repositories page
              And user clicks repository "git-hello-func" from searched results on Repositories page
             Then user will be redirected to PipelineRuns tab

        @regression @odc-7270
        Scenario: Verify page titles for repository details page: P-12-TC04
            Given repository "git-hello-func" is present on the Repositories page
             When user searches repository "git-hello-func" in repositories page
              And user clicks repository "git-hello-func" from searched results on Repositories page
             Then user will be redirected to PipelineRuns tab
              And user will see page title as "git-hello-func · Repository · PipelineRuns · OKD"
              And user clicks on Details tab
              And user will see page title as "git-hello-func · Repository · Details · OKD"
              And user clicks on YAML tab
              And user will see page title as "git-hello-func · Repository · YAML · OKD"