/// <reference types="cypress" />

describe("Create new stakeholder group", () => {
  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    // Clean controls
    cy.get("@tokens").then((tokens) => cy.tackleControlsClean(tokens));

    // Create data
    cy.get("@tokens").then((tokens) => {
      cy.log("Create stakeholders").then(() => {
        return [...Array(11)]
          .map((_, i) => ({
            email: `email-${(i + 10).toString(36)}@domain.com`,
            displayName: `stakeholder-${(i + 10).toString(36)}`,
          }))
          .forEach((payload) => {
            cy.createStakeholder(payload, tokens);
          });
      });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get("@tokens").then((tokens) =>
      cy.tackleControlsCleanStakeholderGroups(tokens)
    );

    // Interceptors
    cy.intercept("GET", "/api/controls/stakeholder-group*").as(
      "getStakeholderGroupsApi"
    );
    cy.intercept("POST", "/api/controls/stakeholder-group*").as(
      "createStakeholderGroupApi"
    );

    // Go to page
    cy.visit("/controls/stakeholder-groups");
  });

  it("With min data", () => {
    // Open modal
    cy.get("button[aria-label='create-stakeholder-group']").click();

    // Verify primary button is disabled
    cy.get("button[aria-label='submit']").should("be.disabled");

    // Fill form
    cy.get("input[name='name']").type("mygroup");
    cy.get("textarea[name='description']").type("mydescription");

    cy.get("button[aria-label='submit']").should("not.be.disabled");
    cy.get("form").submit();

    cy.wait("@createStakeholderGroupApi");
    cy.wait("@getStakeholderGroupsApi");

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "mygroup")
      .should("contain", "mydescription");
  });

  it("With members", () => {
    cy.intercept("GET", "/api/controls/stakeholder*").as("getStakeholdersApi");

    // Open modal
    cy.get("button[aria-label='create-stakeholder-group']").click();
    cy.wait("@getStakeholdersApi");

    // Verify primary button is disabled
    cy.get("button[aria-label='submit']").should("be.disabled");

    // Fill form
    cy.get("input[name='name']").type("mygroup");
    cy.get("textarea[name='description']").type("mydescription");

    cy.get(".pf-c-form__group-control input.pf-c-select__toggle-typeahead")
      .eq(0)
      .type("stakeholder-a")
      .type("{enter}");
    cy.get(".pf-c-form__group-control input.pf-c-select__toggle-typeahead")
      .eq(0)
      .type("stakeholder-b")
      .type("{enter}");

    cy.get("button[aria-label='submit']").should("not.be.disabled");
    cy.get("form").submit();

    cy.wait("@createStakeholderGroupApi");
    cy.wait("@getStakeholderGroupsApi");

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "mygroup")
      .should("contain", "mydescription")
      .should("contain", "2");
  });
});
