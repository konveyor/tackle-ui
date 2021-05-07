import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string, mixed } from "yup";

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
} from "shared/components";
import { useFetchTagTypes } from "shared/hooks";

import { DEFAULT_SELECT_MAX_HEIGHT } from "Constants";
import { createTag, getTags, updateTag } from "api/rest";
import { Tag, TagType } from "api/models";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "utils/utils";

const tagTypeToOption = (value: TagType): OptionWithValue<TagType> => ({
  value,
  toString: () => value.name,
});

export interface FormValues {
  name: string;
  tagType?: OptionWithValue<TagType>;
}

export interface TagFormProps {
  tag?: Tag;
  onSaved: (response: AxiosResponse<Tag>) => void;
  onCancel: () => void;
}

export const TagForm: React.FC<TagFormProps> = ({ tag, onSaved, onCancel }) => {
  const { t } = useTranslation();
  const [error, setError] = useState<AxiosError>();

  const {
    tagTypes,
    isFetching: isFetchingTagTypes,
    fetchError: fetchErrorTagTypes,
    fetchAllTagTypes,
  } = useFetchTagTypes();

  useEffect(() => {
    fetchAllTagTypes();
  }, [fetchAllTagTypes]);

  const tagTypeInitialValue:
    | OptionWithValue<TagType>
    | undefined = useMemo(() => {
    return tag && tag.tagType ? tagTypeToOption(tag.tagType) : undefined;
  }, [tag]);

  const initialValues: FormValues = {
    name: tag?.name || "",
    tagType: tagTypeInitialValue,
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .matches(/^[- \w]+$/, t("validation.onlyCharactersAndUnderscore"))
      .when(["tagType"], (tagType: OptionWithValue<TagType>) => {
        return string().test(
          "duplicate",
          t("validation.duplicate"),
          async (value) => {
            if (!tagType) {
              return true;
            }

            return await getTags(
              { tagTypeIds: [`${tagType.value.id}`] },
              { page: 1, perPage: 3 }
            ).then(({ data }) => {
              return (
                !value || !data._embedded.tag.some((f) => f.name === value)
              );
            });
          }
        );
      }),
    tagType: mixed().required(t("validation.required")),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: Tag = {
      name: formValues.name,
      tagType: formValues.tagType ? formValues.tagType.value : undefined,
    };

    let promise: AxiosPromise<Tag>;
    if (tag) {
      promise = updateTag({
        ...tag,
        ...payload,
      });
    } else {
      promise = createTag(payload);
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
          label={t("terms.tagType")}
          fieldId="tagType"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.tagType)}
          helperTextInvalid={formik.errors.tagType}
        >
          <SingleSelectFetchFormikField
            fieldConfig={{ name: "tagType" }}
            selectConfig={{
              variant: "single",
              "aria-label": "tag-type",
              "aria-describedby": "tag-type",
              placeholderText: t("composed.selectOne", {
                what: t("terms.tagType").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              options: (tagTypes?.data || []).map(tagTypeToOption),
              fetchError: fetchErrorTagTypes,
              isFetching: isFetchingTagTypes,
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
            {!tag ? t("actions.create") : t("actions.save")}
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
