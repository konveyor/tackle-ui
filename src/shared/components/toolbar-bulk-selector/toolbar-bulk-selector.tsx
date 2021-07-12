import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Dropdown,
  DropdownItem,
  DropdownPosition,
  DropdownToggle,
  DropdownToggleCheckbox,
} from "@patternfly/react-core";

export interface IToolbarBulkSelectorProps {
  perPage: number;
  totalItems: number;
  totalSelectedRows: number;
  areAllRowsSelected: boolean;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectCurrentPage: () => void;
}

export const ToolbarBulkSelector: React.FC<IToolbarBulkSelectorProps> = ({
  perPage,
  totalItems,
  areAllRowsSelected,
  totalSelectedRows,
  onSelectAll,
  onSelectNone,
  onSelectCurrentPage,
}) => {
  // i18
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const onDropDownSelect = () => {
    setIsOpen((current) => !current);
  };

  const onDropDownToggle = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  return (
    <Dropdown
      isOpen={isOpen}
      position={DropdownPosition.left}
      onSelect={onDropDownSelect}
      dropdownItems={[
        <DropdownItem key="item-1" onClick={onSelectNone}>
          {t("actions.selectNone")} (0 items)
        </DropdownItem>,
        <DropdownItem key="item-2" onClick={onSelectCurrentPage}>
          {t("actions.selectPage")} ({perPage} items)
        </DropdownItem>,
        <DropdownItem key="item-3" onClick={onSelectAll}>
          {t("actions.selectAll")} ({totalItems} items)
        </DropdownItem>,
      ]}
      toggle={
        <DropdownToggle
          onToggle={onDropDownToggle}
          splitButtonItems={[
            <DropdownToggleCheckbox
              id="toolbar-bulk-select"
              key="toolbar-bulk-select"
              aria-label="Select"
              isChecked={
                areAllRowsSelected
                  ? true
                  : totalSelectedRows === 0
                  ? false
                  : null
              }
              onClick={() => {
                totalSelectedRows > 0 ? onSelectNone() : onSelectAll();
              }}
            ></DropdownToggleCheckbox>,
          ]}
        >
          {totalSelectedRows !== 0 && (
            <>
              {totalSelectedRows} {t("terms.selected").toLowerCase()}
            </>
          )}
        </DropdownToggle>
      }
    />
  );
};
