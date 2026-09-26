# Definition of Ready

In order for the console team to pick up an issue (story or a bug), the following fields in Jira need to be set with appropriate inputs. It is the contributor's responsibility to provide the necessary input. A sufficient level of detail is required, since it will serve as input for AI tools which will be carrying out implementation of the task.

In case an appropriate level of input is not available, the Console team reserves the right to pause the work on the issue.

## Jira Bug

Project: OCPBUGS

All fields are mandatory unless explicitly marked as optional.

* **Description:**  
  * Description of problem  
  * Version-Release
    * Cluster type
    * Cluster version
    * Feature gate
  * How reproducible  
  * Steps to Reproduce  
  * Actual results  
  * Expected result  
  * Additional info  
    * Configuration  
      1. Browser (Chrome by default)
    * Artifacts (at least one, linked in the description or in comments)
      1. Screenshot/recording  
      2. Must-gather  
      3. HAR file  
      4. Console stack trace  
* **Affects versions**  
* **Fix Versions**  
* **Target Backport Versions** (optional)  
* **Target Version**  
* **Severity**  
* **Priority** (optional)  
* **Component:** Management Console

## Jira Story

Project: CONSOLE

All fields are mandatory unless explicitly marked as optional.

* **Description:**
  * Overall Objective  
  * User Stories (e.g., As a *kubeadmin*…, As a *developer* …)  
  * UX Designs (linked in the description or in comments)
  * Test Cases  
    * Optional — in order to open the Jira Story  
    * Required — in order to call the Jira Story **Ready**  
  * Configuration  
    * Cluster type  
    * Feature gate  
* **Priority** (optional)  
* **Components**

## Role Assignment

Once a bug or story meets the criteria above and is declared ready, the OCP Console team will assign the following roles on the Jira issue:

* **Assignee**  
  * Responsible for code changes  
  * Creates the Pull Request  
* **QA Contact**  
  * Must be a different person than the Assignee  
  * Acts as the Pull Request assignee on GitHub  
  * Responsible for code review  
  * Responsible for functional verification
