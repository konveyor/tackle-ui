import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Label, ToolbarChip } from "@patternfly/react-core";
import {
  cellWidth,
  ICell,
  IRow,
  sortable,
  TableText,
} from "@patternfly/react-table";

import {
  AppTableToolbarToggleGroup,
  AppTableWithControls,
} from "shared/components";
import { useFilter, useTableControls, useTableFilter } from "shared/hooks";

import { Assessment, Risk } from "api/models";
import { ToolbarSearchFilter } from "pages/application-inventory/application-list/components/toolbar-search-filter";
import { SelectRiskFilter } from "./components/select-risk-filter";

enum FilterKey {
  RISK = "risk",
}

interface ITableItem {
  questionValue: string;
  answerValue?: string;
  riskValue: Risk;
}

export interface IApplicationAssessmentSummaryTableProps {
  assessment: Assessment;
}

export const ApplicationAssessmentSummaryTable: React.FC<IApplicationAssessmentSummaryTableProps> = ({
  assessment,
}) => {
  const { t } = useTranslation();

  // Filters

  const filters = [
    {
      key: FilterKey.RISK,
      name: t("terms.risk"),
    },
  ];

  const {
    filters: filtersValue,
    filtersApplied,
    addFilter,
    setFilter,
    removeFilter,
    clearAllFilters,
  } = useFilter();

  // Table

  const tableItems: ITableItem[] = useMemo(() => {
    return assessment.questionnaire.categories
      .slice(0)
      .sort((a, b) => a.order - b.order)
      .flatMap((f) => f.questions)
      .map((f) => {
        return {
          questionValue: f.question,
          answerValue: f.options.find((q) => q.checked === true)?.option,
          riskValue: f.options.find((q) => q.checked === true)?.risk,
        } as ITableItem;
      });
  }, [assessment]);

  const compareToByColumn = (
    a: ITableItem,
    b: ITableItem,
    columnIndex?: number
  ) => {
    switch (columnIndex) {
      case 2: // Risk
        return a.riskValue.localeCompare(b.riskValue);
      default:
        return 0;
    }
  };

  const {
    paginationQuery: pagination,
    sortByQuery: sortBy,
    handlePaginationChange: onPaginationChange,
    handleSortChange: onSort,
  } = useTableControls();

  const { pageItems, filteredItems } = useTableFilter<ITableItem>({
    items: tableItems,
    sortBy,
    compareToByColumn,
    pagination,
    filterItem: () => true,
  });

  const columns: ICell[] = [
    {
      title: t("terms.question"),
      transforms: [cellWidth(45)],
      cellFormatters: [],
    },
    {
      title: t("terms.answer"),
      transforms: [cellWidth(45)],
      cellFormatters: [],
    },
    {
      title: t("terms.risk"),
      transforms: [cellWidth(10), sortable],
      cellFormatters: [],
    },
  ];

  const rows: IRow[] = [];
  pageItems.forEach((item) => {
    let riskLabel = <Label color="green">Green</Label>;
    if (item.riskValue === "GREEN") {
      riskLabel = <Label color="green">Green</Label>;
    } else if (item.riskValue === "AMBER") {
      riskLabel = <Label color="orange">Amber</Label>;
    } else if (item.riskValue === "RED") {
      riskLabel = <Label color="red">Red</Label>;
    } else {
      riskLabel = <Label color="grey">Unknown</Label>;
    }

    rows.push({
      cells: [
        {
          title: (
            <TableText wrapModifier="truncate">{item.questionValue}</TableText>
          ),
        },
        {
          title: (
            <TableText wrapModifier="truncate">{item.answerValue}</TableText>
          ),
        },
        {
          title: riskLabel,
        },
      ],
    });
  });

  //

  return (
    <AppTableWithControls
      count={filteredItems.length}
      pagination={pagination}
      sortBy={sortBy}
      onPaginationChange={onPaginationChange}
      onSort={onSort}
      cells={columns}
      rows={rows}
      isLoading={false}
      filtersApplied={filtersApplied}
      toolbarClearAllFilters={clearAllFilters}
      toolbarToggle={
        <AppTableToolbarToggleGroup
          options={filters}
          filtersValue={filtersValue}
          onDeleteFilter={removeFilter}
        >
          <ToolbarSearchFilter
            options={filters}
            filterInputs={[
              {
                key: FilterKey.RISK,
                input: (
                  <SelectRiskFilter
                    value={filtersValue.get(FilterKey.RISK)}
                    onChange={(values) => setFilter(FilterKey.RISK, values)}
                  />
                ),
              },
            ]}
          />
        </AppTableToolbarToggleGroup>
      }
    />
  );
};
