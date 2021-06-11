import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Bullseye,
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  PageSection,
  PageSectionVariants,
  Popover,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Text,
  TextContent,
  Toolbar,
  ToolbarChip,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  ToolbarItemVariant,
} from "@patternfly/react-core";
import { HelpIcon } from "@patternfly/react-icons";

import { useApplicationToolbarFilter, useFetch } from "shared/hooks";
import {
  ApplicationToolbarToggleGroup,
  AppPlaceholder,
  ConditionalRender,
  StateError,
} from "shared/components";

import { ApplicationFilterKey } from "Constants";

import { ApplicationSortBy, getApplications } from "api/rest";
import { Application, ApplicationPage } from "api/models";
import { applicationPageMapper, fetchAllPages } from "api/apiUtils";

import { ApplicationSelectionContextProvider } from "./application-selection-context";
import { Landscape } from "./components/landscape";
import { AdoptionCandidateTable } from "./components/adoption-candidate-table";
import { AdoptionPlan } from "./components/adoption-plan";
import { IdentifiedRisksTable } from "./components/identified-risks-table";

export const Reports: React.FC = () => {
  // i18
  const { t } = useTranslation();

  // Cards
  const [isAdoptionPlanOpen, setAdoptionPlanOpen] = useState(false);
  const [isRiskCardOpen, setIsRiskCardOpen] = useState(false);

  // Toolbar filters
  const {
    filters: filtersValue,
    addFilter,
    setFilter,
    clearAllFilters,
  } = useApplicationToolbarFilter();

  const fetchApplications = useCallback(() => {
    const nameVal = filtersValue.get(ApplicationFilterKey.NAME);
    const descriptionVal = filtersValue.get(ApplicationFilterKey.DESCRIPTION);
    const serviceVal = filtersValue.get(ApplicationFilterKey.BUSINESS_SERVICE);
    const tagVal = filtersValue.get(ApplicationFilterKey.TAG);

    const getApplicationPage = (page: number) => {
      return getApplications(
        {
          name: nameVal?.map((f) => f.key),
          description: descriptionVal?.map((f) => f.key),
          businessService: serviceVal?.map((f) => f.key),
          tag: tagVal?.map((f) => f.key),
        },
        { page: page, perPage: 100 },
        { field: ApplicationSortBy.NAME }
      );
    };

    return fetchAllPages<Application, ApplicationPage>(
      getApplicationPage,
      (responseData) => applicationPageMapper(responseData).data,
      (responseData) => applicationPageMapper(responseData).meta.count
    );
  }, [filtersValue]);

  const {
    data: applications,
    isFetching: isFetchingApplications,
    fetchError: fetchErrorApplications,
    requestFetch: refreshApplications,
  } = useFetch<Application[]>({
    defaultIsFetching: true,
    onFetchPromise: fetchApplications,
  });

  useEffect(() => {
    refreshApplications();
  }, [filtersValue, refreshApplications]);

  const pageHeaderSection = (
    <PageSection variant={PageSectionVariants.light}>
      <TextContent>
        <Text component="h1">{t("terms.reports")}</Text>
      </TextContent>
      <Toolbar clearAllFilters={clearAllFilters}>
        <ToolbarContent style={{ paddingRight: 0, paddingLeft: 0 }}>
          <ApplicationToolbarToggleGroup
            value={filtersValue as Map<ApplicationFilterKey, ToolbarChip[]>}
            addFilter={addFilter}
            setFilter={setFilter}
          />
          <ToolbarGroup alignment={{ default: "alignRight" }}>
            <ToolbarItem variant={ToolbarItemVariant.pagination}>
              {applications ? applications.length : 0} items
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
    </PageSection>
  );

  if (fetchErrorApplications) {
    return (
      <>
        {pageHeaderSection}
        <PageSection>
          <StateError />
        </PageSection>
      </>
    );
  }

  return (
    <>
      {pageHeaderSection}
      <PageSection>
        <ConditionalRender
          when={isFetchingApplications}
          then={<AppPlaceholder />}
        >
          <ApplicationSelectionContextProvider
            applications={applications || []}
          >
            <Stack hasGutter>
              <StackItem>
                <Card>
                  <CardHeader>
                    <TextContent>
                      <Text component="h3">Current landscape</Text>
                    </TextContent>
                  </CardHeader>
                  <CardBody>
                    <Bullseye>
                      <Landscape />
                    </Bullseye>
                  </CardBody>
                </Card>
              </StackItem>
              <StackItem>
                <Card>
                  <CardHeader>
                    <TextContent>
                      <Text component="h3">
                        Adoption candidate distribution
                      </Text>
                    </TextContent>
                  </CardHeader>
                  <CardBody>
                    <AdoptionCandidateTable />
                  </CardBody>
                </Card>
              </StackItem>
              <StackItem>
                <Card isExpanded={isAdoptionPlanOpen}>
                  <CardHeader
                    onExpand={() => setAdoptionPlanOpen((current) => !current)}
                  >
                    <CardTitle>
                      <Split style={{ marginTop: -5 }}>
                        <SplitItem>
                          <Bullseye style={{ marginTop: -3 }}>
                            <TextContent>
                              <Text component="h3">
                                Suggested adoption plan
                              </Text>
                            </TextContent>
                          </Bullseye>
                        </SplitItem>
                        <SplitItem>
                          <Popover
                            bodyContent={
                              <div>
                                The suggested approach to migration based on
                                effort, priority, and dependencies.
                              </div>
                            }
                            position="right"
                          >
                            <button
                              type="button"
                              aria-label="More info"
                              onClick={(e) => e.preventDefault()}
                              className="pf-c-button pf-m-plain"
                            >
                              <HelpIcon />
                            </button>
                          </Popover>
                        </SplitItem>
                      </Split>
                    </CardTitle>
                  </CardHeader>
                  <CardExpandableContent>
                    <CardBody style={{ maxHeight: 700, overflowY: "auto" }}>
                      {isAdoptionPlanOpen && <AdoptionPlan />}
                    </CardBody>
                  </CardExpandableContent>
                </Card>
              </StackItem>
              <StackItem>
                <Card isExpanded={isRiskCardOpen}>
                  <CardHeader
                    onExpand={() => setIsRiskCardOpen((current) => !current)}
                  >
                    <CardTitle>
                      <Split style={{ marginTop: -3 }}>
                        <SplitItem>
                          <Bullseye>
                            <TextContent>
                              <Text component="h3">Identified risks</Text>
                            </TextContent>
                          </Bullseye>
                        </SplitItem>
                      </Split>
                    </CardTitle>
                  </CardHeader>
                  <CardExpandableContent>
                    <CardBody>
                      {isRiskCardOpen && <IdentifiedRisksTable />}
                    </CardBody>
                  </CardExpandableContent>
                </Card>
              </StackItem>
            </Stack>
          </ApplicationSelectionContextProvider>
        </ConditionalRender>
      </PageSection>
    </>
  );
};
