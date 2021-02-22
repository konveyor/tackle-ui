import React, { useEffect, useState } from "react";
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
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import { createBusinessService, updateBusinessService } from "api/rest";
import { BusinessService, Stakeholder } from "api/models";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "utils/utils";

import { SelectStakeholderFormField } from "../select-stakeholder-form-field";
import { useFetchStakeholders } from "shared/hooks";

export interface FormValues {
  name: string;
  description?: string;
  owner?: Stakeholder;
}

export interface BusinessServiceFormProps {
  businessService?: BusinessService;
  onSaved: (response: AxiosResponse<BusinessService>) => void;
  onCancel: () => void;
}

export const BusinessServiceForm: React.FC<BusinessServiceFormProps> = ({
  businessService,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<AxiosError>();

  const {
    stakeholders,
    isFetching,
    fetchError,
    fetchAllStakeholders,
  } = useFetchStakeholders();

  useEffect(() => {
    fetchAllStakeholders();
  }, [fetchAllStakeholders]);

  const initialValues: FormValues = {
    name: businessService?.name || "",
    description: businessService?.description || "",
    owner: businessService?.owner,
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .matches(/^[- \w]+$/, t("validation.onlyCharactersAndUnderscore")),
    description: string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 })),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: BusinessService = {
      name: formValues.name,
      description: formValues.description,
      owner: formValues.owner ? { ...formValues.owner } : undefined,
    };

    let promise: AxiosPromise<BusinessService>;
    if (businessService) {
      promise = updateBusinessService({
        ...businessService,
        ...payload,
      });
    } else {
      promise = createBusinessService(payload);
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
          label={t("terms.name")}
          fieldId="name"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.name)}
          helperTextInvalid={formik.errors.name}
        >
          <TextInput
            type="text"
            name="name"
            aria-label="name"
            aria-describedby="name"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.name}
            validated={getValidatedFromErrorTouched(
              formik.errors.name,
              formik.touched.name
            )}
            autoComplete="off"
          />
        </FormGroup>
        <FormGroup
          label={t("terms.description")}
          fieldId="description"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.description)}
          helperTextInvalid={formik.errors.description}
        >
          <TextArea
            type="text"
            name="description"
            aria-label="description"
            aria-describedby="description"
            isRequired={false}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.description}
            validated={getValidatedFromErrorTouched(
              formik.errors.description,
              formik.touched.description
            )}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.owner")}
          fieldId="owner"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.owner)}
          helperTextInvalid={formik.errors.owner}
        >
          <SelectStakeholderFormField
            name="owner"
            stakeholders={stakeholders?.data || []}
            isFetching={isFetching}
            fetchError={fetchError}
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
            {!businessService ? t("actions.create") : t("actions.save")}
          </Button>
          <Button
            type="button"
            aria-label="cancel"
            variant={ButtonVariant.link}
            isDisabled={formik.isSubmitting || formik.isValidating}
            onClick={onCancel}
          >
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};