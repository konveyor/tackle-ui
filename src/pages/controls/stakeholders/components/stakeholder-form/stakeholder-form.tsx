import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string } from "yup";

import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  TextInput,
} from "@patternfly/react-core";

import {
  SingleSelectFetchFormikField,
  OptionWithValue,
  MultiSelectFetchFormikField,
} from "shared/components";
import { useFetchStakeholderGroups, useFetchJobFunctions } from "shared/hooks";

import { DEFAULT_SELECT_MAX_HEIGHT } from "Constants";
import {
  createStakeholder,
  getStakeholders,
  updateStakeholder,
} from "api/rest";
import { JobFunction, Stakeholder, StakeholderGroup } from "api/models";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "utils/utils";

const jobFunctionToOption = (
  value: JobFunction
): OptionWithValue<JobFunction> => ({
  value,
  toString: () => value.role,
});

const stakeholderGroupToOption = (
  value: StakeholderGroup
): OptionWithValue<StakeholderGroup> => ({
  value,
  toString: () => value.name,
});

export interface FormValues {
  email: string;
  displayName: string;
  jobFunction?: OptionWithValue<JobFunction>;
  stakeholderGroups?: OptionWithValue<StakeholderGroup>[];
}

export interface StakeholderFormProps {
  stakeholder?: Stakeholder;
  onSaved: (response: AxiosResponse<Stakeholder>) => void;
  onCancel: () => void;
}

export const StakeholderForm: React.FC<StakeholderFormProps> = ({
  stakeholder,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<AxiosError>();

  const {
    jobFunctions,
    isFetching: isFetchingJobFunctions,
    fetchError: fetchErrorJobFunctions,
    fetchAllJobFunctions,
  } = useFetchJobFunctions();

  useEffect(() => {
    fetchAllJobFunctions();
  }, [fetchAllJobFunctions]);

  const {
    stakeholderGroups,
    isFetching: isFetchingGroups,
    fetchError: fetchErrorGroups,
    fetchAllStakeholderGroups,
  } = useFetchStakeholderGroups();

  useEffect(() => {
    fetchAllStakeholderGroups();
  }, [fetchAllStakeholderGroups]);

  const jobFunctionInitialValue:
    | OptionWithValue<JobFunction>
    | undefined = useMemo(() => {
    return stakeholder && stakeholder.jobFunction
      ? jobFunctionToOption(stakeholder.jobFunction)
      : undefined;
  }, [stakeholder]);

  const stakeholderGroupsInitialValue:
    | OptionWithValue<StakeholderGroup>[]
    | undefined = useMemo(() => {
    return stakeholder && stakeholder.stakeholderGroups
      ? stakeholder.stakeholderGroups.map(stakeholderGroupToOption)
      : undefined;
  }, [stakeholder]);

  const initialValues: FormValues = {
    email: stakeholder?.email || "",
    displayName: stakeholder?.displayName || "",
    jobFunction: jobFunctionInitialValue,
    stakeholderGroups: stakeholderGroupsInitialValue,
  };

  const validationSchema = object().shape({
    email: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .email(t("validation.email"))
      .test("duplicate", t("validation.duplicate"), async (value) => {
        return await getStakeholders(
          { email: [value || ""] },
          { page: 1, perPage: 2 }
        ).then(({ data }) => {
          return (
            !value || !data._embedded.stakeholder.some((f) => f.email === value)
          );
        });
      }),
    displayName: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(250, t("validation.maxLength", { length: 250 })),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: Stakeholder = {
      email: formValues.email,
      displayName: formValues.displayName,
      jobFunction: formValues.jobFunction
        ? formValues.jobFunction.value
        : undefined,
      stakeholderGroups: formValues.stakeholderGroups?.map((f) => f.value),
    };

    let promise: AxiosPromise<Stakeholder>;
    if (stakeholder) {
      promise = updateStakeholder({
        ...stakeholder,
        ...payload,
      });
    } else {
      promise = createStakeholder(payload);
    }

    promise
      .then((response) => {
        formikHelpers.setSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        formikHelpers.setSubmitting(false);
        setError(error);
      });
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: onSubmit,
  });

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        {error && (
          <Alert
            variant="danger"
            isInline
            title={getAxiosErrorMessage(error)}
          />
        )}
        <FormGroup
          label={t("terms.email")}
          fieldId="email"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.email)}
          helperTextInvalid={formik.errors.email}
        >
          <TextInput
            type="text"
            name="email"
            aria-label="email"
            aria-describedby="email"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.email}
            validated={getValidatedFromErrorTouched(
              formik.errors.email,
              formik.touched.email
            )}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.displayName")}
          fieldId="displayName"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.displayName)}
          helperTextInvalid={formik.errors.displayName}
        >
          <TextInput
            type="text"
            name="displayName"
            aria-label="displayName"
            aria-describedby="displayName"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.displayName}
            validated={getValidatedFromErrorTouched(
              formik.errors.displayName,
              formik.touched.displayName
            )}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.jobFunction")}
          fieldId="jobFunction"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.jobFunction)}
          helperTextInvalid={formik.errors.jobFunction}
        >
          <SingleSelectFetchFormikField
            fieldConfig={{ name: "jobFunction" }}
            selectConfig={{
              variant: "typeahead",
              "aria-label": "job-function",
              "aria-describedby": "job-function",
              placeholderText: t("composed.selectOne", {
                what: t("terms.jobFunction").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              options: (jobFunctions?.data || []).map(jobFunctionToOption),
              isFetching: isFetchingJobFunctions,
              fetchError: fetchErrorJobFunctions,
            }}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.group(s)")}
          fieldId="stakeholderGroups"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.stakeholderGroups)}
          helperTextInvalid={formik.errors.stakeholderGroups}
        >
          <MultiSelectFetchFormikField
            fieldConfig={{ name: "stakeholderGroups" }}
            selectConfig={{
              variant: "typeaheadmulti",
              "aria-label": "stakeholder-groups",
              "aria-describedby": "stakeholder-groups",
              placeholderText: t("composed.selectOne", {
                what: t("terms.group").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              options: (stakeholderGroups?.data || []).map(
                stakeholderGroupToOption
              ),
              isFetching: isFetchingGroups,
              fetchError: fetchErrorGroups,
            }}
            isEqual={(a: any, b: any) => {
              const option1 = a as OptionWithValue<StakeholderGroup>;
              const option2 = b as OptionWithValue<StakeholderGroup>;
              return option1.value.id === option2.value.id;
            }}
          />
        </FormGroup>

        <ActionGroup>
          <Button
            type="submit"
            aria-label="submit"
            variant={ButtonVariant.primary}
            isDisabled={
              !formik.isValid ||
              !formik.dirty ||
              formik.isSubmitting ||
              formik.isValidating
            }
          >
            {!stakeholder ? t("actions.create") : t("actions.save")}
          </Button>
          <Button
            type="button"
            aria-label="cancel"
            variant={ButtonVariant.link}
            isDisabled={formik.isSubmitting}
            onClick={onCancel}
          >
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
