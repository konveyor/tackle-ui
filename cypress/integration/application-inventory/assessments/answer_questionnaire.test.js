/// <reference types="cypress" />

describe("Answer questionnaire", () => {
  // Global access to use it on brower URL
  let assessment;

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    let application;

    // Clean app inventory
    cy.get("@tokens").then((tokens) => cy.tackleAppInventoryClean(tokens));

    // Create application
    cy.get("@tokens").then((tokens) => {
      cy.log("Create applications").then(() => {
        cy.createApplication({ name: "application-1" }, tokens).then((data) => {
          application = data;
        });
      });
    });

    // Create assessment
    cy.get("@tokens").then((tokens) => {
      cy.deleteAssessmentByApplicationId(application.id, tokens);
      cy.createAssessment(
        {
          applicationId: application.id,
        },
        tokens
      ).then((data) => {
        assessment = data;
      });
    });
  });

  beforeEach(() => {
    // Interceptors
    cy.intercept("PATCH", "/api/pathfinder/assessments/*").as(
      "patchAssessmentApi"
    );
    cy.intercept("GET", "/api/pathfinder/assessments*").as("getAssessmentsApi");

    cy.intercept("GET", "/api/application-inventory/application*").as(
      "getApplicationsApi"
    );
    cy.intercept("GET", "/api/application-inventory/application/*").as(
      "getApplicationApi"
    );

    // Go to page
    cy.visit("/application-inventory/assessment/" + assessment.id);
  });

  it("Answer questionnaire", () => {
    // First step
    cy.get(".pf-c-wizard__footer button[cy-data='back']").should("be.disabled");
    cy.get(".pf-c-wizard__footer").find("button[cy-data='next']").click();

    // Category 1
    for (let i = 0; i < 5; i++) {
      cy.get(".pf-c-wizard__footer button[cy-data='next']").should(
        "be.disabled"
      );

      cy.get("div[cy-data='question']").each((question) => {
        cy.wrap(question).find("input[type='radio']").eq(i).check();
      });

      cy.get(".pf-c-wizard__footer button[cy-data='next']").should(
        "not.be.disabled"
      );

      cy.get(".pf-c-wizard__footer").find("button[cy-data='next']").click();
    }

    cy.wait("@patchAssessmentApi");
    cy.wait("@getApplicationsApi");
    cy.wait("@getAssessmentsApi");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("Completed");
  });

  it("Answer questionnaire and go to review page", () => {
    // First step
    cy.get(".pf-c-wizard__footer button[cy-data='back']").should("be.disabled");
    cy.get(".pf-c-wizard__footer").find("button[cy-data='next']").click();

    // Category 1
    for (let i = 0; i < 5; i++) {
      cy.get(".pf-c-wizard__footer button[cy-data='next']").should(
        "be.disabled"
      );

      cy.get("div[cy-data='question']").each((question) => {
        cy.wrap(question).find("input[type='radio']").eq(i).check();
      });

      cy.get(".pf-c-wizard__footer button[cy-data='next']").should(
        "not.be.disabled"
      );

      if (i < 4) {
        cy.get(".pf-c-wizard__footer").find("button[cy-data='next']").click();
      } else {
        cy.get(".pf-c-wizard__footer")
          .find("button[cy-data='save-and-review']")
          .click();
      }
    }

    cy.wait("@patchAssessmentApi");
    cy.wait("@getApplicationApi");

    cy.url().should(
      "match",
      new RegExp("/application-inventory/application/.*/review")
    );
  });
});
