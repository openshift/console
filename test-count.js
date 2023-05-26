const fs = require("fs");
const readline = require("readline");
const path = require("path");
const scenario = "Scenario";
const manual = "@manual";
const regres = "@regression";
const smoke = "@smoke";
const todo = "@to-do";
const broken = "@broken-test";
const unverified = "@un-verified";
const precondition = "@pre-condition";
const tags = [
  "pre-condition",
  "un-verified",
  "broken-test",
  "e2e",
  "to-do",
  "manual",
  "regression",
  "smoke",
];
const FILENAME =
  typeof __filename !== "undefined"
    ? __filename
    : (/^ +at (?:file:\/*(?=\/)|)(.*?):\d+:\d+$/m.exec(Error().stack) || "")[1];
const DIRNAME =
  typeof __dirname !== "undefined"
    ? __dirname
    : FILENAME.replace(/[\/\\].*?$/, "");
const testCount = new Map();
let completedFiles = new Map();
let packages = [];

function formattedOutput() {
  let jsonContent = "";
  let htmlContent = `<!DOCTYPE html>
  <html>
  <head>
  <style>
  table {
    font-family: arial, sans-serif;
    border-collapse: collapse;
    width: 100%;
  }
  
  td, th {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
  }
  </style>
  </head>
  <body>
  
  <h2>Automation Status Report</h2>
  
  <p>In Below Table,   T → Total test scenarios count,  I → Identified test scenarios for automation,  A - Automated scenarios</p>
  <table>
    <tr>
      <th>Package</th>
      <th>Total</th>
      <th>Manual</th>
      <th>Total Automation possible test scenarios</th>
      <td colspan="9">Test Count Status</td>
      <th>Automation Completed</th>
    </tr>
      <tr>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <td colspan="3">Smoke (@smoke)</td>
      <td colspan="3">Regression (@regression)</td>
      <td colspan="3">Others</td>
      <th></th>
  
    </tr>
      <tr>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th>T</th>
      <th>I</th>
      <th>A</th>
      <th>T</th>
      <th>I</th>
      <th>A</th>
      <th>T</th>
      <th>I</th>
      <th>A</th>
    </tr>`;
  for (let i = 0; i < packages.length; i++) {
    let packageName = packages[i];

    const totalTest = testCount.get(`${packageName}_totalTest`);
    const manualTest = testCount.get(`${packageName}_manual`) || 0;
    const todoTest =
      testCount.get(`${packageName}_totalTest`) -
        testCount.get(`${packageName}_manual`) || 0;
    const smokeTest = testCount.get(`${packageName}_smoke`) || 0;
    const smokeTodoTest = testCount.get(`${packageName}_smoke_todo`) || 0;
    const smokeAutomated =
      (testCount.get(`${packageName}_smoke`) || 0) -
      (testCount.get(`${packageName}_smoke_todo`) || 0);
    const regressionTest = testCount.get(`${packageName}_regres`) || 0;
    const regressionTodoTest = testCount.get(`${packageName}_regres_todo`) || 0;
    const regressionAutomated =
      (testCount.get(`${packageName}_regres`) || 0) -
      (testCount.get(`${packageName}_regres_todo`) || 0);
    const otherTotalTest = testCount.get(`${packageName}_other`) || 0;
    const otherTodoTest = testCount.get(`${packageName}_other_todo`) || 0;
    const automationCompletedPercentage =
      ((smokeAutomated + regressionAutomated + otherTotalTest) /
        (manualTest + smokeTest + regressionTest + otherTotalTest)) *
      100;

    htmlContent += `
      <tr>
        <td>${packageName}</td>
        <td>${totalTest}</td>
        <td>${manualTest}</td>
        <td>${todoTest}</td>
        <td>${smokeTest}</td>
        <td>${smokeTodoTest}</td>
        <td>${smokeAutomated}</td>
        <td>${regressionTest}</td>
        <td>${regressionTodoTest}</td>
        <td>${regressionAutomated}</td>
        <td>${otherTotalTest}</td>
        <td>${otherTodoTest}</td>
        <td>${otherTotalTest - otherTodoTest}</td>
        <td>${
          Math.round((automationCompletedPercentage + Number.EPSILON) * 100) /
          100
        }%</td>

      </tr>`;

    jsonContent += `
            "${packageName}" : {
                "total" : ${totalTest},    
                "manual" : ${manualTest},
                "possible_automation" : ${todoTest},
                "smoke" : {
                    "total" : ${smokeTest},
                    "todo" : ${smokeTodoTest},
                    "automated" : ${smokeAutomated}
                },
                "regression" : {
                    "total" : ${regressionTest},
                    "todo" : ${regressionTodoTest},
                    "automated" : ${regressionAutomated}
                },
                "other" : {
                    "total" : ${otherTotalTest},
                    "todo" : ${otherTodoTest},
                    "automated" : ${otherTotalTest - otherTodoTest}
                },
                "automation_completed_percentage": ${automationCompletedPercentage}
            }`;

    if (i < packages.length - 1) {
      jsonContent = jsonContent + ",";
    }
  }

  htmlContent += "</table></body></html>";
  jsonContent = "{" + jsonContent + "}";

  fs.writeFile(
    "./testCountResult.html",
    htmlContent,
    { encoding: "utf8" },
    (err) => {
      if (err) {
        throw err;
      }
    }
  );

  fs.writeFile(
    "./testCountResult.json",
    jsonContent,
    { encoding: "utf8" },
    (err) => {
      if (err) {
        throw err;
      }
    }
  );
}

function testCountTemplate(testCountMap, packageName, testTag) {
  testCountMap.set(
    `${packageName}_${testTag}`,
    testCountMap.get(`${packageName}_${testTag}`) + 1 || 1
  );
}

function lineParser(lineText, packageName, universalTag) {
  if (lineText.trim().split(" ")[0] !== "#") {
    if (lineText.includes(scenario)) {
      testCountTemplate(testCount, packageName, "totalTest");

      if (universalTag !== undefined) {
        if (
          ["broken-test", "pre-condition", "un-verified"].includes(universalTag)
        ) {
          universalTag = "other";
        }
        testCountTemplate(testCount, packageName, universalTag);
      }
    }

    if (lineText.includes(manual)) {
      testCountTemplate(testCount, packageName, "manual");
    }

    if (lineText.includes(smoke)) {
      testCountTemplate(testCount, packageName, "smoke");
    }

    if (lineText.includes(smoke) && lineText.includes(todo)) {
      testCountTemplate(testCount, packageName, "smoke_todo");
    }

    if (lineText.includes(regres)) {
      testCountTemplate(testCount, packageName, "regres");
    }

    if (lineText.includes(regres) && lineText.includes(todo)) {
      testCountTemplate(testCount, packageName, "regres_todo");
    }

    if (
      lineText.includes(broken) ||
      lineText.includes(unverified) ||
      lineText.includes(precondition)
    ) {
      if (lineText.includes(todo)) {
        testCountTemplate(testCount, packageName, "other_todo");
      } else {
        testCountTemplate(testCount, packageName, "other");
      }
    }
  }
}

function fileParser(fileName, directoryPath) {
  let universalTag;
  let packageName;
  const directoryElements = directoryPath.split("/");
  testCount.set(`${fileName}_line_no`, 0);

  var r = readline.createInterface({
    input: fs.createReadStream(directoryPath + "/" + fileName),
  });

  r.on("line", function (text) {
    if (testCount.get(`${fileName}_line_no`) === 0) {
      if (text.includes("@")) {
        packageName = text.trim().split("@")[1].trim();
        if (tags.includes(packageName)) {
          packageName =
            directoryElements[directoryElements.indexOf("packages") + 1].trim();
        }
      } else {
        packageName =
          directoryElements[directoryElements.indexOf("packages") + 1].trim();
      }

      if (packageName === "dev-console") {
        packageName =
          directoryElements[directoryElements.indexOf("features") + 1].trim();
      }

      if (!packages.includes(packageName)) {
        packages.push(packageName);
      }

      let filteredArray = text.split("@").filter((word) => {
        if (tags.includes(word)) return word;
      }); // it is assumend that only one tag is filtered
      universalTag = filteredArray[0];
    }
    lineParser(text, packageName, universalTag);

    testCount.set(
      `${fileName}_line_no`,
      testCount.get(`${fileName}_line_no` + 1)
    );
  });

  r.on("close", () => {
    if (completedFiles.get(`${fileName}`) === undefined) {
      completedFiles.set(`${fileName}`, 1);
    } else {
      formattedOutput();
    }
  });
}

async function crawlDirectory(directoryPath) {
  if (fs.lstatSync(directoryPath).isDirectory()) {
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        throw err;
      } else {
        files.forEach((file) => {
          if (
            path.extname(file) === ".feature" &&
            !directoryPath.includes("e2e")
          ) {
            fileParser(file, directoryPath);
          }
          if (!file.includes(".") && fs.statSync(directoryPath)) {
            let childDirectory = path.join(directoryPath, file);
            crawlDirectory(childDirectory);
          }
        });
      }
    });
  }
}

crawlDirectory(path.join(DIRNAME, `frontend/packages`));