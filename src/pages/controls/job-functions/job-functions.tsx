import React, { useCallback, useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  Button,
  ButtonVariant,
  Modal,
  ModalVariant,
  ToolbarChip,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  cellWidth,
  ICell,
  IRow,
  sortable,
  TableText,
} from "@patternfly/react-table";

import { useDispatch } from "react-redux";
import { alertActions } from "store/alert";
import { confirmDialogActions } from "store/confirmDialog";

import {
  AppPlaceholder,
  AppTableActionButtons,
  AppTableWithControls,
  ConditionalRender,
  AppTableToolbarToggleGroup,
  NoDataEmptyState,
  SearchFilter,
} from "shared/components";
import {
  useTableControls,
  useDeleteJobFunction,
  useFetchJobFunctions,
  useEntityModal,
} from "shared/hooks";

import { getAxiosErrorMessage } from "utils/utils";
import { JobFunctionSortBy, JobFunctionSortByQuery } from "api/rest";
import { SortByQuery, JobFunction } from "api/models";

import { JobFunctionForm } from "./components/job-function-form";

enum FilterKey {
  NAME = "name",
}

const toSortByQuery = (
  sortBy?: SortByQuery
): JobFunctionSortByQuery | undefined => {
  if (!sortBy) {
    return undefined;
  }

  let field: JobFunctionSortBy;
  switch (sortBy.index) {
    case 0:
      field = JobFunctionSortBy.ROLE;
      break;
    default:
      throw new Error("Invalid column index=" + sortBy.index);
  }

  return {
    field,
    direction: sortBy.direction,
  };
};

const ENTITY_FIELD = "entity";

export const JobFunctions: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const filters = [
    {
      key: FilterKey.NAME,
      name: t("terms.name"),
    },
  ];
  const [filtersValue, setFiltersValue] = useState<Map<FilterKey, string[]>>(
    new Map([])
  );

  const {
    isOpen: isJobFunctionModalOpen,
    data: jobFunctionToUpdate,
    create: openCreateJobFunctionModal,
    update: openUpdateJobFunctionModal,
    close: closeJobFunctionModal,
  } = useEntityModal<JobFunction>();

  const { deleteJobFunction } = useDeleteJobFunction();

  const {
    jobFunctions,
    isFetching,
    fetchError,
    fetchJobFunctions,
  } = useFetchJobFunctions(true);

  const {
    paginationQuery,
    sortByQuery,
    handlePaginationChange,
    handleSortChange,
  } = useTableControls({
    sortByQuery: { direction: "asc", index: 0 },
  });

  const refreshTable = useCallback(() => {
    fetchJobFunctions(
      {
        role: filtersValue.get(FilterKey.NAME),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchJobFunctions]);

  useEffect(() => {
    fetchJobFunctions(
      {
        role: filtersValue.get(FilterKey.NAME),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchJobFunctions]);

  //

  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(70)],
      cellFormatters: [],
    },
    {
      title: "",
      props: {
        className: "pf-u-text-align-right",
      },
    },
  ];

  const rows: IRow[] = [];
  jobFunctions?.data.forEach((item) => {
    rows.push({
      [ENTITY_FIELD]: item,
      cells: [
        {
          title: <TableText wrapModifier="truncate">{item.role}</TableText>,
        },
        {
          title: (
            <AppTableActionButtons
              onEdit={() => editRow(item)}
              onDelete={() => deleteRow(item)}
            />
          ),
        },
      ],
    });
  });

  // Rows

  const editRow = (row: JobFunction) => {
    openUpdateJobFunctionModal(row);
  };

  const deleteRow = (row: JobFunction) => {
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.jobFunction")
        title: t("dialog.title.delete", {
          what: t("terms.jobFunction").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          deleteJobFunction(
            row,
            () => {
              dispatch(confirmDialogActions.closeDialog());
              if (jobFunctions?.data.length === 1) {
                handlePaginationChange({ page: paginationQuery.page - 1 });
              } else {
                refreshTable();
              }
            },
            (error) => {
              dispatch(confirmDialogActions.closeDialog());
              dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
            }
          );
        },
      })
    );
  };

  // Advanced filters

  const handleOnClearAllFilters = () => {
    setFiltersValue((current) => {
      const newVal = new Map(current);
      Array.from(newVal.keys()).forEach((key) => {
        newVal.set(key, []);
      });
      return newVal;
    });
  };

  const handleOnAddFilter = (key: string, filterText: string) => {
    const filterKey: FilterKey = key as FilterKey;
    setFiltersValue((current) => {
      const values: string[] = current.get(filterKey) || [];
      return new Map(current).set(filterKey, [...values, filterText]);
    });

    handlePaginationChange({ page: 1 });
  };

  const handleOnDeleteFilter = (
    key: string,
    value: (string | ToolbarChip)[]
  ) => {
    const filterKey: FilterKey = key as FilterKey;
    setFiltersValue((current) =>
      new Map(current).set(filterKey, value as string[])
    );
  };

  // Create/update Modal

  const handleOnJobFunctionFormSaved = (
    response: AxiosResponse<JobFunction>
  ) => {
    if (!jobFunctionToUpdate) {
      dispatch(
        alertActions.addSuccess(
          // t('terms.jobFunction')
          t("toastr.success.added", {
            what: response.data.role,
            type: t("terms.jobFunction").toLowerCase(),
          })
        )
      );
    }

    closeJobFunctionModal();
    refreshTable();
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(jobFunctions || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={jobFunctions ? jobFunctions.meta.count : 0}
          pagination={paginationQuery}
          sortBy={sortByQuery}
          onPaginationChange={handlePaginationChange}
          onSort={handleSortChange}
          cells={columns}
          rows={rows}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          toolbarClearAllFilters={handleOnClearAllFilters}
          filtersApplied={
            Array.from(filtersValue.values()).reduce(
              (previous, current) => [...previous, ...current],
              []
            ).length > 0
          }
          toolbarToggle={
            <AppTableToolbarToggleGroup
              categories={filters}
              chips={filtersValue}
              onChange={handleOnDeleteFilter}
            >
              <SearchFilter
                options={filters}
                onApplyFilter={handleOnAddFilter}
              />
            </AppTableToolbarToggleGroup>
          }
          toolbar={
            <ToolbarGroup variant="button-group">
              <ToolbarItem>
                <Button
                  type="button"
                  aria-label="create-job-function"
                  variant={ButtonVariant.primary}
                  onClick={openCreateJobFunctionModal}
                >
                  {t("actions.createNew")}
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          }
          noDataState={
            <NoDataEmptyState
              // t('terms.jobFunctions')
              title={t("composed.noDataStateTitle", {
                what: t("terms.jobFunctions").toLowerCase(),
              })}
              // t('terms.jobFunction')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.jobFunction").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>

      <Modal
        // t('dialog.title.update')
        // t('dialog.title.new')
        // t('terms.jobFunction')
        title={t(`dialog.title.${jobFunctionToUpdate ? "update" : "new"}`, {
          what: t("terms.jobFunction").toLowerCase(),
        })}
        variant={ModalVariant.medium}
        isOpen={isJobFunctionModalOpen}
        onClose={closeJobFunctionModal}
      >
        <JobFunctionForm
          jobFunction={jobFunctionToUpdate}
          onSaved={handleOnJobFunctionFormSaved}
          onCancel={closeJobFunctionModal}
        />
      </Modal>
    </>
  );
};
