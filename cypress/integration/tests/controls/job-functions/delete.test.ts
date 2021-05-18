/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { JobFunctions } from "../../../models/job-function";

describe("Delete job function", () => {
  const jobFunctions = new JobFunctions();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "JobFunction");
      cy.api_crud(tokens, "JobFunction", "POST", {
        role: "function-a",
      });
    });

    // Interceptors
    cy.intercept("DELETE", "/api/controls/job-function/*").as(
      "deleteJobFunction"
    );
    cy.intercept("GET", "/api/controls/job-function*").as("getJobFunctions");
  });

  it("Delete the only item available", () => {
    jobFunctions.delete(0);
    cy.wait("@deleteJobFunction");

    // Verify table
    cy.wait("@getJobFunctions");
    cy.get(
      ".pf-c-empty-state > .pf-c-empty-state__content > .pf-c-title"
    ).contains("No job functions available");
  });
});