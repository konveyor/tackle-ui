import React from "react";
import { useTranslation } from "react-i18next";

import { SelectVariant, ToolbarChip } from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";

import { OptionWithValue, SimpleSelect } from "shared/components";

import {
  DEFAULT_RISK_LABELS,
  DEFAULT_RISK_LIST,
  DEFAULT_SELECT_MAX_HEIGHT,
} from "Constants";
import { Risk } from "api/models";
import { getToolbarChipKey } from "utils/utils";

const riskToToolbarChip = (value: Risk): ToolbarChip => {
  const label: string = DEFAULT_RISK_LABELS.get(value)?.label || value;

  return {
    key: value,
    node: label,
  };
};

const riskToOption = (value: Risk): OptionWithValue<Risk> => {
  const label = DEFAULT_RISK_LABELS.get(value)?.label || value;

  return {
    value,
    toString: () => label,
    compareTo: (selectOption: any) => {
      // If "string" we are just filtering
      if (typeof selectOption === "string") {
        return label.toLowerCase().includes(selectOption.toLowerCase());
      }
      // If not "string" we are selecting a checkbox
      else {
        return (
          selectOption.value &&
          (selectOption as OptionWithValue<Risk>).value === value
        );
      }
    },
  };
};

export interface ISelectRiskFilterProps {
  value?: ToolbarChip[];
  onChange: (values: ToolbarChip[]) => void;
}

export const SelectRiskFilter: React.FC<ISelectRiskFilterProps> = ({
  value = [],
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <SimpleSelect
      toggleIcon={<FilterIcon />}
      width={200}
      variant={SelectVariant.checkbox}
      aria-label="risk"
      aria-labelledby="risk"
      placeholderText={t("terms.risk")}
      maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
      value={value
        .map((a) => DEFAULT_RISK_LIST.find((b) => getToolbarChipKey(a) === b))
        .filter((f) => f !== undefined)
        .map((f) => riskToOption(f!))}
      options={DEFAULT_RISK_LIST.map(riskToOption)}
      onChange={(option) => {
        const optionValue = (option as OptionWithValue<Risk>).value;

        const elementExists = value.some(
          (f) => getToolbarChipKey(f) === optionValue
        );
        let newIds: ToolbarChip[];
        if (elementExists) {
          newIds = value.filter((f) => getToolbarChipKey(f) !== optionValue);
        } else {
          newIds = [...value, riskToToolbarChip(optionValue)];
        }

        onChange(newIds);
      }}
      hasInlineFilter
      onClear={() => onChange([])}
    />
  );
};
