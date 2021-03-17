import React from "react";
import { AxiosError } from "axios";
import { FieldHookConfig, useField } from "formik";

import { SelectStakeholder } from "shared/components";
import { Stakeholder } from "api/models";

export interface SelectMemberFormFieldProps {
  stakeholders: Stakeholder[];
  isFetching: boolean;
  fetchError?: AxiosError;
}

export const SelectMemberFormField: React.FC<
  FieldHookConfig<Stakeholder[] | undefined> & SelectMemberFormFieldProps
> = ({ stakeholders, isFetching, fetchError, ...props }) => {
  const [field, , helpers] = useField(props);

  const handleOnSelect = (value: Stakeholder | Stakeholder[]) => {
    if (!Array.isArray(value)) {
      throw new Error("Component was expecting an array");
    }

    helpers.setValue(value);
  };

  const handleOnClear = () => {
    helpers.setValue([]);
  };

  return (
    <SelectStakeholder
      placeholderText="Select a stakeholder"
      isMulti={true}
      value={field.value}
      stakeholders={stakeholders}
      isFetching={isFetching}
      fetchError={fetchError}
      onSelect={handleOnSelect}
      onClear={handleOnClear}
    />
  );
};
