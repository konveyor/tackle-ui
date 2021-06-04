import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  Alert,
  AlertVariant,
  Bullseye,
  Card,
  CardBody,
  CardHeader,
  PageSection,
  PageSectionVariants,
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

import { useApplicationToolbarFilter, useFetch } from "shared/hooks";
import {
  ApplicationToolbarToggleGroup,
  AppPlaceholder,
  ConditionalRender,
} from "shared/components";

import { ApplicationFilterKey } from "Constants";

import { ApplicationSortBy, getApplications } from "api/rest";
import { Application, ApplicationPage } from "api/models";
import { applicationPageMapper, fetchAllPages } from "api/apiUtils";
import { getAxiosErrorMessage } from "utils/utils";

import { Landscape } from "./components/landscape";
import { AdoptionCandidateTable } from "./components/adoption-candidate-table";

export const Reports: React.FC = () => {
  // i18
  const { t } = useTranslation();

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
        <ToolbarContent>
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
          <Alert title="Error" variant={AlertVariant.danger}>
            {getAxiosErrorMessage(fetchErrorApplications)}
          </Alert>
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
                    <Landscape applications={applications || []} />
                  </Bullseye>
                </CardBody>
              </Card>
            </StackItem>
            <StackItem>
              <Card>
                <CardHeader>
                  <TextContent>
                    <Text component="h3">Adoption candidate distribution</Text>
                  </TextContent>
                </CardHeader>
                <CardBody>
                  <AdoptionCandidateTable applications={applications || []} />
                </CardBody>
              </Card>
            </StackItem>
          </Stack>
        </ConditionalRender>
      </PageSection>
    </>
  );
};
