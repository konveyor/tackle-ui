import React, { useState } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";

import {
  ActionGroup,
  Alert,
  Button,
  FileUpload,
  Form,
  FormGroup,
} from "@patternfly/react-core";

import { useDispatch } from "react-redux";
import { alertActions } from "store/alert";

import { UPLOAD_FILE } from "api/rest";
import { getAxiosErrorMessage } from "utils/utils";

export interface ImportApplicationsFormProps {
  onSaved: (response: AxiosResponse) => void;
}

export const ImportApplicationsForm: React.FC<ImportApplicationsFormProps> = ({
  onSaved,
}) => {
  const [file, setFile] = useState<File>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AxiosError>();

  // Redux
  const dispatch = useDispatch();

  const onSubmit = () => {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("fileName", file.name);
    const config = {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    };
    setIsSubmitting(true);
    axios
      .post(UPLOAD_FILE, formData, config)
      .then((response) => {
        dispatch(alertActions.addSuccess("Success! applications imported."));

        setIsSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        setIsSubmitting(false);
        setError(error);
      });
  };
  return (
    <Form>
      {error && <Alert variant="danger" title={getAxiosErrorMessage(error)} />}

      <FormGroup label="Upload your application file" fieldId="file">
        <FileUpload
          id="file"
          name="file"
          value={file}
          filename={file?.name}
          onChange={(value, filename) => {
            if (filename && typeof value !== "string") {
              setFile(value);
            } else if (!filename) {
              setFile(undefined);
            }
          }}
        />
      </FormGroup>
      <ActionGroup>
        <Button variant="primary" onClick={onSubmit} isDisabled={isSubmitting}>
          Import
        </Button>
      </ActionGroup>
    </Form>
  );
};
