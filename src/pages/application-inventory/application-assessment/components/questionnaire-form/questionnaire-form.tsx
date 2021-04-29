import React, { useMemo } from "react";
import { Field } from "formik";
import { useTranslation } from "react-i18next";

import {
  Popover,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Text,
  TextArea,
  TextContent,
} from "@patternfly/react-core";
import { HelpIcon } from "@patternfly/react-icons";

import { QuestionnaireCategory } from "api/models";
import { getValidatedFromError } from "utils/utils";

import { MultiInputSelection } from "./multi-input-selection";
import { Question, QuestionHeader, QuestionBody } from "./question";

import { getCommentFieldName } from "../../formik-utils";

export interface QuestionnaireFormProps {
  category: QuestionnaireCategory;
}

export const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({
  category,
}) => {
  const { t } = useTranslation();

  const sortedQuestions = useMemo(() => {
    return category.questions.sort((a, b) => a.order - b.order);
  }, [category]);

  // Comments

  const commentFieldName = `comments.${getCommentFieldName(category)}`;

  const validateComment = (val: string) => {
    const maxLength = 1_000;

    let error;
    if (val && val.length > maxLength) {
      error = t("validation.maxLength", { length: maxLength });
    }
    return error;
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text component="h1">{category.title}</Text>
        </TextContent>
      </StackItem>
      {sortedQuestions.map((question) => (
        <StackItem key={question.id}>
          <Question>
            <QuestionHeader>
              <Split hasGutter>
                <SplitItem>{question.question}</SplitItem>
                <SplitItem>
                  <Popover bodyContent={<div>{question.description}</div>}>
                    <button
                      type="button"
                      aria-label="More info"
                      onClick={(e) => e.preventDefault()}
                      className="pf-c-form__group-label-help"
                    >
                      <HelpIcon />
                    </button>
                  </Popover>
                </SplitItem>
              </Split>
            </QuestionHeader>
            <QuestionBody>
              <MultiInputSelection question={question} />
            </QuestionBody>
          </Question>
        </StackItem>
      ))}
      <StackItem>
        <Question>
          <QuestionHeader>Additional notes or comments</QuestionHeader>
          <QuestionBody>
            <Field name={commentFieldName} validate={validateComment}>
              {({ field, form, meta }: any) => (
                <TextArea
                  rows={4}
                  type="text"
                  name={commentFieldName}
                  aria-label="comments"
                  aria-describedby="comments"
                  isRequired={false}
                  onChange={(_, event) => field.onChange(event)}
                  onBlur={(event) => field.onBlur(event)}
                  value={field.value}
                  validated={getValidatedFromError(meta.error)}
                />
              )}
            </Field>
          </QuestionBody>
        </Question>
      </StackItem>
    </Stack>
  );
};