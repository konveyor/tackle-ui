import React, { useState } from "react";

import { Button, InputGroup, TextInput } from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";

import { SimpleFilterDropdown } from "shared/components";
import { DropdownOption } from "shared/components/simple-filter-dropdown/simple-filter-dropdown";

interface FilterOption {
  key: string;
  name: React.ReactNode;
}

export interface SearchFilterProps {
  options: FilterOption[];
  onApplyFilter: (key: string, filterText: string) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  options,
  onApplyFilter,
}) => {
  const [filterText, setFilterText] = useState("");
  const [selected, setSelected] = useState<DropdownOption | undefined>(
    options[0]
  );

  const handleOnSelect = (dropdownOption: {
    key: string;
    name: React.ReactNode;
  }) => {
    setSelected(dropdownOption);
    setFilterText("");
  };

  const handleOnChangeFilterText = (value: string) => {
    setFilterText(value);
  };

  const handleOnSearch = () => {
    if (filterText.trim().length > 0 && selected) {
      onApplyFilter(selected.key, filterText.trim());
      setFilterText("");
    }
  };

  const handleOnSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleOnSearch();
    }
  };

  return (
    <InputGroup>
      <SimpleFilterDropdown
        label={selected?.name}
        options={[...options]}
        onSelect={handleOnSelect}
      />
      <TextInput
        type="text"
        value={filterText}
        onChange={handleOnChangeFilterText}
        onKeyPress={handleOnSearchKeyPress}
        placeholder="Filter..."
        aria-label="filter-text"
      />
      <Button variant="control" aria-label="search" onClick={handleOnSearch}>
        <SearchIcon />
      </Button>
    </InputGroup>
  );
};
