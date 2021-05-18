/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { Stakeholder } from "../../../models/stakeholder";

describe("Filter business services", () => {
  const stakeholder = new Stakeholder();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    // Data
    const stakeholderGroups = [];
    const jobFunctions = [];

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Stakeholder");
      cy.api_clean(tokens, "StakeholderGroup");
      cy.api_clean(tokens, "JobFunction");

      cy.log("")
        .then(() => {
          // Create stakeholder groups
          return [...Array(11)]
            .map((_, i) => ({
              name: `group-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(
                tokens,
                "StakeholderGroup",
                "POST",
                payload
              ).then((data) => stakeholderGroups.push(data));
            });
        })
        .then(() => {
          // Create job functions
          return [...Array(11)]
            .map((_, i) => ({
              role: `function-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "JobFunction", "POST", payload).then((data) =>
                jobFunctions.push(data)
              );
            });
        })
        .then(() => {
          // Create stakeholders
          return [...Array(11)]
            .map((_, i) => ({
              email: `email-${(i + 10).toString(36)}@domain.com`,
              displayName: `stakeholder-${(i + 10).toString(36)}`,
              stakeholderGroups: stakeholderGroups.slice(0, i),
              jobFunction: jobFunctions[i],
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "Stakeholder", payload);
            });
        });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    // Inteceptors
    cy.intercept("GET", "/api/controls/stakeholder*").as("getStakeholders");
  });

  it("By email", () => {
    stakeholder.openPage();
    cy.wait("@getStakeholders");

    // First filter
    stakeholder.applyFilter(0, "email-a");

    cy.wait("@getStakeholders");
    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("email-a");

    // Second filter
    stakeholder.applyFilter(0, "email-k");

    cy.wait("@getStakeholders");
    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("email-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("email-k");
  });

  it("By displayName", () => {
    stakeholder.openPage();
    cy.wait("@getStakeholders");

    // First filter
    stakeholder.applyFilter(1, "stakeholder-a");

    cy.wait("@getStakeholders");
    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("stakeholder-a");

    // Second filter
    stakeholder.applyFilter(1, "stakeholder-k");

    cy.wait("@getStakeholders");
    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("stakeholder-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("stakeholder-k");
  });

  it("By job function", () => {
    stakeholder.openPage();
    cy.wait("@getStakeholders");

    // First filter
    stakeholder.applyFilter(2, "function-j");

    cy.wait("@getStakeholders");
    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("function-j");
  });

  it("By group", () => {
    stakeholder.openPage();
    cy.wait("@getStakeholders");

    // First filter
    stakeholder.applyFilter(3, "group-j");

    cy.wait("@getStakeholders");
    cy.get(".pf-c-table").pf4_table_row_expand(0);
    cy.get(".pf-c-table > tbody > tr.pf-c-table__expandable-row")
      .find(".pf-c-description-list .pf-c-description-list__text")
      .contains("group-j");
  });
});
