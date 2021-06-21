import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";

import {
  FormGroup,
  FormSection,
  Grid,
  GridItem,
  Text,
  TextContent,
} from "@patternfly/react-core";

import { useFetch } from "shared/hooks";

import { DEFAULT_SELECT_MAX_HEIGHT } from "Constants";
import { getValidatedFromError } from "utils/utils";

import { StakeholderGroupPage, StakeholderPage } from "api/models";
import {
  getAllStakeholderGroups,
  getAllStakeholders,
  stakeholderGroupPageMapper,
  stakeholderPageMapper,
} from "api/apiUtils";

import { IFormValues } from "../../form-utils";

import { StakeholderSelect } from "./stakeholder-select";
import { StakeholderGroupSelect } from "./stakeholder-group-select";

export interface StakeholdersFormProps {}

export const StakeholdersForm: React.FC<StakeholdersFormProps> = () => {
  const { t } = useTranslation();
  const formik = useFormikContext<IFormValues>();

  // Fetch stakeholders

  const {
    data: stakeholdersPage,
    isFetching: isFetchingStakeholders,
    fetchError: fetchErrorStakeholders,
    requestFetch: fetchAllStakeholders,
  } = useFetch<StakeholderPage>({
    defaultIsFetching: true,
    onFetch: getAllStakeholders,
  });

  const stakeholders = useMemo(() => {
    return stakeholdersPage
      ? stakeholderPageMapper(stakeholdersPage)
      : undefined;
  }, [stakeholdersPage]);

  useEffect(() => {
    fetchAllStakeholders();
  }, [fetchAllStakeholders]);

  // Fetch stakeholder groups

  const {
    data: stakeholderGroupPage,
    isFetching: isFetchingStakeholderGroups,
    fetchError: fetchErrorStakeholderGroups,
    requestFetch: fetchAllStakeholderGroups,
  } = useFetch<StakeholderGroupPage>({
    defaultIsFetching: true,
    onFetch: getAllStakeholderGroups,
  });

  const stakeholderGroups = useMemo(() => {
    return stakeholderGroupPage
      ? stakeholderGroupPageMapper(stakeholderGroupPage)
      : undefined;
  }, [stakeholderGroupPage]);

  useEffect(() => {
    fetchAllStakeholderGroups();
  }, [fetchAllStakeholderGroups]);

  return (
    <div className="pf-c-form">
      <FormSection>
        <TextContent>
          <Text component="h1">Select stakeholders</Text>
          <Text component="p">
            Select the stakeholder(s) or stakeholder group(s) associated with
            this assessment.
          </Text>
        </TextContent>
      </FormSection>

      <Grid className="pf-c-form__section">
        <GridItem md={6} className="pf-c-form">
          <FormSection>
            <FormGroup
              label={t("terms.stakeholders")}
              fieldId="stakeholders"
              isRequired={false}
              validated={getValidatedFromError(formik.errors.stakeholders)}
              helperTextInvalid={formik.errors.stakeholders}
            >
              <StakeholderSelect
                fieldConfig={{
                  name: "stakeholders",
                }}
                selectConfig={{
                  variant: "typeaheadmulti",
                  "aria-label": "stakeholders",
                  "aria-describedby": "stakeholders",
                  // t('terms.stakeholder(s)')
                  placeholderText: t("composed.selectMany", {
                    what: t("terms.stakeholder(s)").toLowerCase(),
                  }),
                  maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                  isFetching: isFetchingStakeholders,
                  fetchError: fetchErrorStakeholders,
                }}
                stakeholders={stakeholders?.data || []}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.stakeholderGroups")}
              fieldId="stakeholderGroups"
              isRequired={false}
              validated={getValidatedFromError(formik.errors.stakeholderGroups)}
              helperTextInvalid={formik.errors.stakeholderGroups}
            >
              <StakeholderGroupSelect
                fieldConfig={{
                  name: "stakeholderGroups",
                }}
                selectConfig={{
                  variant: "typeaheadmulti",
                  "aria-label": "stakeholder-groups",
                  "aria-describedby": "stakeholder-groups",
                  // t('terms.stakeholderGroup(s)')
                  placeholderText: t("composed.selectMany", {
                    what: t("terms.stakeholderGroup(s)").toLowerCase(),
                  }),
                  maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                  isFetching: isFetchingStakeholderGroups,
                  fetchError: fetchErrorStakeholderGroups,
                }}
                stakeholderGroups={stakeholderGroups?.data || []}
              />
            </FormGroup>
          </FormSection>
        </GridItem>
      </Grid>
    </div>
  );
};
