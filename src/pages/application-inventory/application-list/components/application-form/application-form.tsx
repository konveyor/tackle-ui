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
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import {
  SingleSelectFetchFormikField,
  MultiSelectFetchFormikField,
  OptionWithValue,
} from "shared/components";
import { useFetchBusinessServices, useFetchTagTypes } from "shared/hooks";

import { DEFAULT_SELECT_MAX_HEIGHT } from "Constants";
import {
  createApplication,
  getApplications,
  TagTypeSortBy,
  updateApplication,
} from "api/rest";
import { Application, BusinessService, Tag } from "api/models";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "utils/utils";

const businesServiceToOption = (
  value: BusinessService
): OptionWithValue<BusinessService> => ({
  value,
  toString: () => value.name,
});

const tagToOption = (value: Tag): OptionWithValue<Tag> => ({
  value,
  toString: () => value.name,
  props: {
    description: value.tagType?.name,
  },
});

export interface FormValues {
  name: string;
  description?: string;
  comments?: string;
  businessService?: OptionWithValue<BusinessService>;
  tags?: OptionWithValue<Tag>[];
}

export interface ApplicationFormProps {
  application?: Application;
  onSaved: (response: AxiosResponse<Application>) => void;
  onCancel: () => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  application,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<AxiosError>();

  // Business services

  const {
    businessServices,
    isFetching: isFetchingBusinessServices,
    fetchError: fetchErrorBusinessServices,
    fetchAllBusinessServices,
  } = useFetchBusinessServices();

  useEffect(() => {
    fetchAllBusinessServices();
  }, [fetchAllBusinessServices]);

  // TagTypes

  const {
    tagTypes,
    isFetching: isFetchingTagTypes,
    fetchError: fetchErrorTagTypes,
    fetchAllTagTypes,
  } = useFetchTagTypes();

  useEffect(() => {
    fetchAllTagTypes({ field: TagTypeSortBy.RANK });
  }, [fetchAllTagTypes]);

  // Tags

  const [tags, setTags] = useState<Tag[]>();

  useEffect(() => {
    if (tagTypes) {
      setTags(tagTypes.data.flatMap((f) => f.tags || []));
    }
  }, [tagTypes]);

  // Formik

  const businessServiceInitialValue = useMemo(() => {
    let result: OptionWithValue<BusinessService> | undefined = undefined;
    if (
      application &&
      application.businessService &&
      businessServices &&
      businessServices.data
    ) {
      const businessServiceId = Number(application.businessService);
      const businessService = businessServices.data.find(
        (f) => f.id === businessServiceId
      );

      result = businesServiceToOption({
        id: businessServiceId,
        name: businessService ? businessService.name : t("terms.notAvailable"),
      });
    }

    return result;
  }, [application, businessServices, t]);

  const tagsInitialValue = useMemo(() => {
    let result: OptionWithValue<Tag>[] | undefined = undefined;

    const notAvailable = t("terms.notAvailable");
    if (application && application.tags && tags) {
      result = application.tags.map((t) => {
        const exists = tags.find((f) => `${f.id}` === t);
        return exists
          ? tagToOption(exists)
          : tagToOption({ id: Number(t), name: notAvailable });
      });
    }

    return result;
  }, [application, tags, t]);

  const initialValues: FormValues = {
    name: application?.name || "",
    description: application?.description || "",
    comments: application?.comments || "",
    businessService: businessServiceInitialValue,
    tags: tagsInitialValue,
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test("duplicate", t("validation.duplicate"), async (value) => {
        return await getApplications(
          { name: [value || ""] },
          { page: 1, perPage: 2 }
        ).then(({ data }) => {
          return (
            !value || !data._embedded.application.some((f) => f.name === value)
          );
        });
      }),
    description: string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 })),
    comments: string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 })),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: Application = {
      name: formValues.name,
      description: formValues.description,
      comments: formValues.comments,
      businessService: formValues.businessService
        ? `${formValues.businessService.value.id}`
        : undefined,
      tags: formValues.tags
        ? formValues.tags.map((f) => `${f.value.id}`)
        : undefined,
    };

    let promise: AxiosPromise<Application>;
    if (application) {
      promise = updateApplication({
        ...application,
        ...payload,
      });
    } else {
      promise = createApplication(payload);
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
          />
        </FormGroup>
        <FormGroup
          label={t("terms.description")}
          fieldId="description"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.description)}
          helperTextInvalid={formik.errors.description}
        >
          <TextInput
            type="text"
            name="description"
            aria-label="description"
            aria-describedby="description"
            isRequired={true}
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
          label={t("terms.businessService")}
          fieldId="businessService"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.businessService)}
          helperTextInvalid={formik.errors.businessService}
        >
          <SingleSelectFetchFormikField
            fieldConfig={{
              name: "businessService",
            }}
            selectConfig={{
              variant: "typeahead",
              "aria-label": "business-service",
              "aria-describedby": "business-service",
              // t("terms.businessService")
              placeholderText: t("composed.selectOne", {
                what: t("terms.businessService").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              options: (businessServices?.data || []).map(
                businesServiceToOption
              ),
              isFetching: isFetchingBusinessServices,
              fetchError: fetchErrorBusinessServices,
            }}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.tags")}
          fieldId="tags"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.tags)}
          helperTextInvalid={formik.errors.tags}
        >
          <MultiSelectFetchFormikField
            fieldConfig={{
              name: "tags",
            }}
            selectConfig={{
              variant: "typeaheadmulti",
              "aria-label": "tags",
              "aria-describedby": "tags",
              // t("terms.tag(s)")
              placeholderText: t("composed.selectOne", {
                what: t("terms.tag(s)").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              options: (tags || []).map(tagToOption),
              isFetching: isFetchingTagTypes,
              fetchError: fetchErrorTagTypes,
            }}
            isEqual={(a: any, b: any) => {
              const option1 = a as OptionWithValue<Tag>;
              const option2 = b as OptionWithValue<Tag>;
              return option1.value.id === option2.value.id;
            }}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.comments")}
          fieldId="comments"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.comments)}
          helperTextInvalid={formik.errors.comments}
        >
          <TextArea
            type="text"
            name="comments"
            aria-label="comments"
            aria-describedby="comments"
            isRequired={false}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.comments}
            validated={getValidatedFromErrorTouched(
              formik.errors.comments,
              formik.touched.comments
            )}
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
            {!application ? t("actions.create") : t("actions.save")}
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
