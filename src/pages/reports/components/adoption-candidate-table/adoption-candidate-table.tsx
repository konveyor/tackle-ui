import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  cellWidth,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  sortable,
  TableVariant,
  truncate,
} from "@patternfly/react-table";
import { Label, ToolbarItem } from "@patternfly/react-core";

import { useFetch, useTableControls, useTableFilter } from "shared/hooks";
import {
  AppTableWithControls,
  ProposedActionLabel,
  ToolbarBulkSelector,
} from "shared/components";

import { EFFORT_ESTIMATE_LIST } from "Constants";
import { Application, AssessmentConfidence } from "api/models";
import { getAssessmentConfidence } from "api/rest";

import { ApplicationSelectionContext } from "../../application-selection-context";

export interface TableRowData {
  application: Application;
  confidence?: number;
}

const compareToByColumn = (
  a: TableRowData,
  b: TableRowData,
  columnIndex?: number
) => {
  switch (columnIndex) {
    case 1: // AppName
      return a.application.name.localeCompare(b.application.name);
    case 2: // Criticality
      return (
        (a.application.review?.businessCriticality || 0) -
        (b.application.review?.businessCriticality || 0)
      );
    case 3: // Priority
      return (
        (a.application.review?.workPriority || 0) -
        (b.application.review?.workPriority || 0)
      );
    case 4: // Confidence
      return (a.confidence || 0) - (b.confidence || 0);
    case 5: // Effort
      const aEffortSortFactor = a.application.review
        ? EFFORT_ESTIMATE_LIST[a.application.review.effortEstimate]
            ?.sortFactor || 0
        : 0;
      const bEffortSortFactor = b.application.review
        ? EFFORT_ESTIMATE_LIST[b.application.review.effortEstimate]
            ?.sortFactor || 0
        : 0;
      return aEffortSortFactor - bEffortSortFactor;
    default:
      return 0;
  }
};

const filterItem = () => true;

const ENTITY_FIELD = "entity";
const getRow = (rowData: IRowData): TableRowData => {
  return rowData[ENTITY_FIELD];
};

export const AdoptionCandidateTable: React.FC = () => {
  // i18
  const { t } = useTranslation();

  // Context
  const {
    allItems: allApplications,
    selectedItems: selectedApplications,
    areAllSelected: areAllApplicationsSelected,
    isItemSelected: isApplicationSelected,
    toggleItemSelected: toggleApplicationSelected,
    selectAll: selectAllApplication,
    setSelectedItems: setSelectedRows,
  } = useContext(ApplicationSelectionContext);

  // Confidence
  const fetchChartData = useCallback(() => {
    return getAssessmentConfidence(allApplications.map((f) => f.id!)).then(
      ({ data }) => data
    );
  }, [allApplications]);

  const { data: confidence, requestFetch: refreshChart } = useFetch<
    AssessmentConfidence[]
  >({
    defaultIsFetching: true,
    onFetchPromise: fetchChartData,
  });

  useEffect(() => {
    if (allApplications.length > 0) {
      refreshChart();
    }
  }, [allApplications, refreshChart]);

  // Table data
  const allRows = useMemo(() => {
    return allApplications.map((app) => {
      const confidenceData = confidence?.find(
        (e) => e.applicationId === app.id
      );
      const result: TableRowData = {
        application: app,
        confidence: confidenceData?.confidence,
      };
      return result;
    });
  }, [allApplications, confidence]);

  // Table
  const {
    paginationQuery: pagination,
    sortByQuery: sortBy,
    handlePaginationChange: onPaginationChange,
    handleSortChange: onSort,
  } = useTableControls({
    paginationQuery: { page: 1, perPage: 10 },
    sortByQuery: { direction: "asc", index: 0 },
  });

  const { pageItems } = useTableFilter<TableRowData>({
    items: allRows,
    sortBy,
    compareToByColumn,
    pagination,
    filterItem: filterItem,
  });

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.applicationName"),
      transforms: [sortable, cellWidth(25)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.criticality"),
      transforms: [sortable, cellWidth(15)],
      cellTransforms: [],
    },
    {
      title: t("terms.priority"),
      transforms: [sortable, cellWidth(15)],
      cellTransforms: [],
    },
    {
      title: t("terms.confidence"),
      transforms: [sortable, cellWidth(15)],
      cellTransforms: [],
    },
    {
      title: t("terms.effort"),
      transforms: [sortable, cellWidth(15)],
      cellTransforms: [],
    },
    {
      title: t("terms.decision"),
      transforms: [cellWidth(15)],
      cellTransforms: [],
    },
  ];

  const rows: IRow[] = [];
  pageItems.forEach((item) => {
    const isSelected = isApplicationSelected(item.application);

    rows.push({
      [ENTITY_FIELD]: item,
      selected: isSelected,
      cells: [
        {
          title: item.application.name,
        },
        {
          title: item.application.review?.businessCriticality,
        },
        {
          title: item.application.review?.workPriority,
        },
        {
          title: item.confidence,
        },
        {
          title: (
            <>
              {item.application.review
                ? EFFORT_ESTIMATE_LIST[item.application.review.effortEstimate]
                    ?.label
                : ""}
            </>
          ),
        },
        {
          title: (
            <>
              {item.application.review ? (
                <ProposedActionLabel
                  action={item.application.review.proposedAction}
                />
              ) : (
                <Label>{t("terms.notReviewed")}</Label>
              )}
            </>
          ),
        },
      ],
    });
  });

  // Row actions
  const selectRow = (
    event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    rowIndex: number,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    if (rowIndex === -1) {
      isSelected ? selectAllApplication() : setSelectedRows([]);
    } else {
      const row = getRow(rowData);
      toggleApplicationSelected(row.application);
    }
  };

  return (
    <AppTableWithControls
      variant={TableVariant.compact}
      count={allApplications.length}
      pagination={pagination}
      sortBy={sortBy}
      onPaginationChange={onPaginationChange}
      onSort={onSort}
      cells={columns}
      rows={rows}
      onSelect={selectRow}
      canSelectAll={false}
      isLoading={false}
      filtersApplied={false}
      toolbarToggle={
        <>
          <ToolbarItem variant="bulk-select">
            <ToolbarBulkSelector
              areAllRowsSelected={areAllApplicationsSelected}
              perPage={pagination.perPage}
              totalItems={allApplications.length}
              totalSelectedRows={selectedApplications.length}
              onSelectAll={selectAllApplication}
              onSelectNone={() => setSelectedRows([])}
              onSelectCurrentPage={() => {
                setSelectedRows(pageItems.map((f) => f.application));
              }}
            />
          </ToolbarItem>
        </>
      }
    />
  );
};
