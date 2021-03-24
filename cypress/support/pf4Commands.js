// Pagination

Cypress.Commands.add(
  "pf4_pagination_goToPage",
  { prevSubject: "element" },
  (container, pageNumer) => {
    cy.wrap(container)
      .find(
        ".pf-c-pagination__nav > .pf-c-pagination__nav-page-select > input[aria-label='Current page']"
      )
      .clear()
      .type(pageNumer)
      .type("{enter}");
  }
);

// Table

Cypress.Commands.add("pf4_table_rows", { prevSubject: "element" }, (table) => {
  return cy.wrap(table).find("tbody > tr").not(".pf-m-expanded");
});

Cypress.Commands.add(
  "pf4_table_action_select",
  { prevSubject: "element" },
  (table, rowIndex, actionName) => {
    cy.wrap(table)
      .find("tbody > tr > td.pf-c-table__action")
      .eq(rowIndex)
      .click();

    cy.wrap(table)
      .find("tbody > tr > td.pf-c-table__action > .pf-c-dropdown > ul > li")
      .contains(actionName)
      .click();
  }
);

Cypress.Commands.add(
  "pf4_table_column_toggle",
  { prevSubject: "element" },
  (table, column) => {
    cy.wrap(table)
      .find("thead > tr > th.pf-c-table__sort")
      .contains(column)
      .click();
  }
);

Cypress.Commands.add(
  "pf4_table_column_isAsc",
  { prevSubject: "element" },
  (table, column) => {
    cy.wrap(table)
      .find("thead > tr > th.pf-c-table__sort.pf-m-selected")
      .should("have.attr", "aria-sort", "ascending")
      .get("button")
      .contains(column);
  }
);

Cypress.Commands.add(
  "pf4_table_column_isDesc",
  { prevSubject: "element" },
  (table, column) => {
    cy.wrap(table)
      .find("thead > tr > th.pf-c-table__sort.pf-m-selected")
      .should("have.attr", "aria-sort", "descending")
      .get("button")
      .contains(column);
  }
);

// Dropdown

Cypress.Commands.add(
  "pf4_dropdown",
  { prevSubject: "element" },
  (dropdown, method, eq) => {
    switch (method) {
      case "toggle":
        return cy.wrap(dropdown).find("button.pf-c-dropdown__toggle").click();
      case "select":
        return cy.wrap(dropdown).find("ul > li").eq(eq);

      default:
        break;
    }
  }
);
