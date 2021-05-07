import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string, number } from "yup";

import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  NumberInput,
  TextInput,
} from "@patternfly/react-core";

import {
  SingleSelectFormikField,
  OptionWithValue,
  Color,
} from "shared/components";

import {
  DEFAULT_SELECT_MAX_HEIGHT,
  DEFAULT_COLOR_PALETE as DEFAULT_COLOR_PALETTE,
} from "Constants";
import { createTagType, getTagTypes, updateTagType } from "api/rest";
import { TagType } from "api/models";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "utils/utils";

const colorToOption = (value: string): OptionWithValue<string> => ({
  value,
  toString: () => value,
  props: {
    children: <Color hex={value} />,
  },
});

export interface FormValues {
  name: string;
  rank?: number;
  color?: OptionWithValue<string>;
}

export interface TagTypeFormProps {
  tagType?: TagType;
  onSaved: (response: AxiosResponse<TagType>) => void;
  onCancel: () => void;
}

export const TagTypeForm: React.FC<TagTypeFormProps> = ({
  tagType,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<AxiosError>();

  const colorInitialValue: OptionWithValue<string> | undefined = useMemo(() => {
    return tagType && tagType.colour
      ? colorToOption(tagType.colour)
      : undefined;
  }, [tagType]);

  const initialValues: FormValues = {
    name: tagType?.name || "",
    rank: tagType?.rank || 1,
    color: colorInitialValue,
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .matches(/^[- \w]+$/, t("validation.onlyCharactersAndUnderscore"))
      .test("duplicate", t("validation.duplicate"), async (value) => {
        return await getTagTypes(
          { tagTypes: [value || ""] },
          { page: 1, perPage: 2 }
        ).then(({ data }) => {
          return (
            !value || !data._embedded["tag-type"].some((f) => f.name === value)
          );
        });
      }),
    rank: number().min(1, t("validation.min", { value: 1 })),
    color: string().trim(),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: TagType = {
      name: formValues.name,
      rank: formValues.rank,
      colour: formValues.color ? formValues.color.value : undefined,
    };

    let promise: AxiosPromise<TagType>;
    if (tagType) {
      promise = updateTagType({
        ...tagType,
        ...payload,
      });
    } else {
      promise = createTagType(payload);
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
          label={t("terms.rank")}
          fieldId="rank"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.rank)}
          helperTextInvalid={formik.errors.rank}
        >
          <NumberInput
            inputName="rank"
            inputAriaLabel="rank"
            minusBtnAriaLabel="minus"
            plusBtnAriaLabel="plus"
            value={formik.values.rank}
            onMinus={() => {
              formik.setFieldValue("rank", (formik.values.rank || 0) - 1);
            }}
            onChange={formik.handleChange}
            onPlus={() => {
              formik.setFieldValue("rank", (formik.values.rank || 0) + 1);
            }}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.color")}
          fieldId="color"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.color)}
          helperTextInvalid={formik.errors.color}
        >
          <SingleSelectFormikField
            fieldConfig={{ name: "color" }}
            selectConfig={{
              variant: "single",
              "aria-label": "color",
              "aria-describedby": "color",
              placeholderText: t("composed.selectOne", {
                what: t("terms.color").toLowerCase(),
              }),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              options: DEFAULT_COLOR_PALETTE.map(colorToOption),
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
            {!tagType ? t("actions.create") : t("actions.save")}
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
