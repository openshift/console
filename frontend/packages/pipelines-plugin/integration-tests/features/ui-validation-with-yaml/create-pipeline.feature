@pipelines
Feature: Create Pipeline using YAML Editor on Pipelines page
              As a user, I want to create the pipeline using YAML Editor on Pipelines page

        Background:
            Given user has created or selected namespace "aut-pipe-add-yaml"


        Scenario Outline: Create pipeline using YAML and YAML Editor
            Given user is at "YAML View" on Pipeline Builder page
             When user creates pipeline resource using YAML editor from "<pipeline_yaml>"
             Then user will see pipeline "<pipeline_name>" is displayed in pipelines page

        Examples:
                  | pipeline_yaml                                         | pipeline_name      |
                  | testData/ui-validation-with-yaml/create-pipeline.yaml | sum-three-pipeline |


        Scenario Outline: Create pipeline using YAML and CLI
             When user creates pipeline using YAML and CLI "<yaml_file>" in "aut-pipe-add-yaml"
             Then user will see pipeline "<pipeline_name>" is displayed in pipelines page

        Examples:
                  | yaml_file                                                    | pipeline_name             |
                  | testData/cli-validation-with-yaml/sum-of-three-pipeline.yaml | sum-three-number-pipeline |
