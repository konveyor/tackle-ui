import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";
import { AxiosError } from "axios";

import {
  FormGroup,
  FormSection,
  Grid,
  GridItem,
  Text,
  TextContent,
} from "@patternfly/react-core";

import {
  OptionWithValue,
  MultiSelectFetchFormikField,
} from "shared/components";
import { useFetchStakeholderGroups, useFetchStakeholders } from "shared/hooks";

import { DEFAULT_SELECT_MAX_HEIGHT } from "Constants";
import { getValidatedFromError } from "utils/utils";
import { Stakeholder, StakeholderGroup } from "api/models";

import { IFormValues } from "../../application-assessment";

const stakeholderToOption = (
  value: Stakeholder
): OptionWithValue<Stakeholder> => ({
  value,
  toString: () => value.displayName,
});

const stakeholderGroupToOption = (
  value: StakeholderGroup
): OptionWithValue<StakeholderGroup> => ({
  value,
  toString: () => value.name,
});

export interface StakeholdersFormProps {}

export const StakeholdersForm: React.FC<StakeholdersFormProps> = () => {
  const { t } = useTranslation();

  const formik = useFormikContext<IFormValues>();

  const {
    stakeholderGroups,
    isFetching: isFetchingStakeholderGroups,
    fetchError: fetchErrorStakeholderGroups,
    fetchAllStakeholderGroups,
  } = useFetchStakeholderGroups();

  useEffect(() => {
    fetchAllStakeholderGroups();
  }, [fetchAllStakeholderGroups]);

  const {
    stakeholders,
    isFetching: isFetchingStakeholders,
    fetchError: fetchErrorStakeholders,
    fetchAllStakeholders,
  } = useFetchStakeholders();

  useEffect(() => {
    fetchAllStakeholders();
  }, [fetchAllStakeholders]);

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
              <MultiSelectFetchFormikField
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
                  options: (stakeholders?.data || []).map(stakeholderToOption),
                  isFetching: isFetchingStakeholders,
                  fetchError: fetchErrorStakeholders,
                }}
                isEqual={(a: any, b: any) => {
                  const option1 = a as OptionWithValue<Stakeholder>;
                  const option2 = b as OptionWithValue<Stakeholder>;
                  return option1.value.id === option2.value.id;
                }}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.stakeholderGroups")}
              fieldId="stakeholderGroups"
              isRequired={false}
              validated={getValidatedFromError(formik.errors.stakeholderGroups)}
              helperTextInvalid={formik.errors.stakeholderGroups}
            >
              <MultiSelectFetchFormikField
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
                  options: (stakeholderGroups?.data || []).map(
                    stakeholderGroupToOption
                  ),
                  isFetching: isFetchingStakeholderGroups,
                  fetchError: fetchErrorStakeholderGroups,
                }}
                isEqual={(a: any, b: any) => {
                  const option1 = a as OptionWithValue<StakeholderGroup>;
                  const option2 = b as OptionWithValue<StakeholderGroup>;
                  return option1.value.id === option2.value.id;
                }}
              />
            </FormGroup>
          </FormSection>
        </GridItem>
      </Grid>
    </div>
  );
};
