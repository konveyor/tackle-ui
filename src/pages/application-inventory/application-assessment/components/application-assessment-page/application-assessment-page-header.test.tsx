import React from "react";
import { shallow } from "enzyme";
import { ApplicationAssessmentPageHeader } from "./application-assessment-page-header";
import { Assessment } from "api/models";
import { mountWithRedux } from "store/reducerUtils";

describe("ApplicationAssessmentPageHeader", () => {
  const assessment: Assessment = {
    status: "STARTED",
    applicationId: 1,
    questionnaire: {
      categories: [],
    },
  };

  it("Renders without crashing", () => {
    const wrapper = mountWithRedux(
      <ApplicationAssessmentPageHeader assessment={assessment}>
        Body of page
      </ApplicationAssessmentPageHeader>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
