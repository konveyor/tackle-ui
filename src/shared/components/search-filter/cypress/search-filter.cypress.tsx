import React from "react";
import { mount } from "@cypress/react";
import { SearchFilter } from "../search-filter";

import "index.scss";

describe("", () => {
  beforeEach(() => {
    const component = {
      applyFilter: (key: string, filterText: string) => {},
    };
    cy.spy(component, "applyFilter").as("applyFilterCallback");

    mount(
      <SearchFilter
        options={[
          { key: "key1", name: "value1" },
          { key: "key2", name: "value2" },
        ]}
        onApplyFilter={component.applyFilter}
      />
    );
  });

  it("First option selected by default", () => {
    cy.get("button.pf-c-dropdown__toggle").contains("value1");
  });

  it("Not callback when inputText is empty", () => {
    cy.get("button[aria-label='search']").click();

    cy.get("@applyFilterCallback").should("not.be.calledOnce");
  });

  it("Apply filter callback pressing 'enter'", () => {
    cy.get("input[aria-label='filter-text']").type("some text").type("{enter}");

    cy.get("@applyFilterCallback")
      .should("be.calledOnce")
      .and("be.calledWith", "key1", "some text");
  });

  it("Apply filter callback click on 'search'", () => {
    cy.get("input[aria-label='filter-text']").type("some text");
    cy.get("button[aria-label='search']").click();

    cy.get("@applyFilterCallback")
      .should("be.calledOnce")
      .and("be.calledWith", "key1", "some text");
  });

  it("Apply second filter callback", () => {
    cy.get("button.pf-c-dropdown__toggle").click();
    cy.get("ul > li > button").eq(1).click();

    cy.get("input[aria-label='filter-text']")
      .type("some other text")
      .type("{enter}");

    cy.get("@applyFilterCallback")
      .should("be.calledOnce")
      .and("be.calledWith", "key2", "some other text");
  });
});
