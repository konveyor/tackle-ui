import React, { useCallback, useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@konveyor/lib-ui";

import {
  Button,
  ButtonVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Modal,
  ModalVariant,
  ToolbarChip,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  expandable,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  sortable,
} from "@patternfly/react-table";

import { useDispatch } from "react-redux";
import { alertActions } from "store/alert";
import { confirmDialogActions } from "store/confirmDialog";

import {
  AppPlaceholder,
  AppTableActionButtons,
  AppTableWithControls,
  ConditionalRender,
  SearchFilter,
  AppTableToolbarToggleGroup,
  NoDataEmptyState,
} from "shared/components";
import {
  useTableControls,
  useFetchStakeholderGroups,
  useDeleteStakeholderGroup,
  useEntityModal,
} from "shared/hooks";

import { getAxiosErrorMessage } from "utils/utils";
import { StakeholderGroupSortBy, StakeholderGroupSortByQuery } from "api/rest";
import { StakeholderGroup, SortByQuery } from "api/models";

import { StakeholderGroupForm } from "./components/stakeholder-group-form";

enum FilterKey {
  NAME = "name",
  DESCRIPTION = "description",
  STAKEHOLDER = "stakeholder",
}

const toSortByQuery = (
  sortBy?: SortByQuery
): StakeholderGroupSortByQuery | undefined => {
  if (!sortBy) {
    return undefined;
  }

  let field: StakeholderGroupSortBy;
  switch (sortBy.index) {
    case 1:
      field = StakeholderGroupSortBy.NAME;
      break;
    case 3:
      field = StakeholderGroupSortBy.STAKEHOLDERS;
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

const getRow = (rowData: IRowData): StakeholderGroup => {
  return rowData[ENTITY_FIELD];
};

export const StakeholderGroups: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const filters = [
    {
      key: FilterKey.NAME,
      name: t("terms.name"),
    },
    {
      key: FilterKey.DESCRIPTION,
      name: t("terms.description"),
    },
    {
      key: FilterKey.STAKEHOLDER,
      name: t("terms.member"),
    },
  ];
  const [filtersValue, setFiltersValue] = useState<Map<FilterKey, string[]>>(
    new Map([])
  );

  const {
    isOpen: isCreateUpdateModalOpen,
    entity: rowToUpdate,
    create: openCreateModal,
    update: openUpdateModal,
    close: closeCreateUpdateModal,
  } = useEntityModal<StakeholderGroup>();

  const { deleteStakeholderGroup } = useDeleteStakeholderGroup();

  const {
    stakeholderGroups,
    isFetching,
    fetchError,
    fetchStakeholderGroups,
  } = useFetchStakeholderGroups(true);

  const {
    paginationQuery,
    sortByQuery,
    handlePaginationChange,
    handleSortChange,
  } = useTableControls({
    sortByQuery: { direction: "asc", index: 1 },
  });

  const {
    isItemSelected: isItemExpanded,
    toggleItemSelected: toggleItemExpanded,
  } = useSelectionState<StakeholderGroup>({
    items: stakeholderGroups?.data || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const refreshTable = useCallback(() => {
    fetchStakeholderGroups(
      {
        name: filtersValue.get(FilterKey.NAME),
        description: filtersValue.get(FilterKey.DESCRIPTION),
        stakeholder: filtersValue.get(FilterKey.STAKEHOLDER),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchStakeholderGroups]);

  useEffect(() => {
    fetchStakeholderGroups(
      {
        name: filtersValue.get(FilterKey.NAME),
        description: filtersValue.get(FilterKey.DESCRIPTION),
        stakeholder: filtersValue.get(FilterKey.STAKEHOLDER),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchStakeholderGroups]);

  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable],
      cellFormatters: [expandable],
    },
    { title: t("terms.description"), transforms: [] },
    {
      title: t("terms.member(s)"),
      transforms: [sortable],
    },
    {
      title: "",
      props: {
        className: "pf-u-text-align-right",
      },
    },
  ];

  const rows: IRow[] = [];
  stakeholderGroups?.data.forEach((item) => {
    const isExpanded = isItemExpanded(item);
    rows.push({
      [ENTITY_FIELD]: item,
      isOpen: isExpanded,
      cells: [
        {
          title: item.name,
        },
        {
          title: item.description,
        },
        {
          title: item.stakeholders ? item.stakeholders.length : 0,
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

    if (isExpanded) {
      rows.push({
        parent: rows.length - 1,
        fullWidth: false,
        cells: [
          <div className="pf-c-table__expandable-row-content">
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t("terms.member(s)")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {item.stakeholders?.map((f) => f.displayName).join(", ")}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </div>,
        ],
      });
    }
  });

  // Rows

  const collapseRow = (
    event: React.MouseEvent,
    rowIndex: number,
    isOpen: boolean,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleItemExpanded(row);
  };

  const editRow = (row: StakeholderGroup) => {
    openUpdateModal(row);
  };

  const deleteRow = (row: StakeholderGroup) => {
    dispatch(
      confirmDialogActions.openDialog({
        title: t("dialog.title.delete", { what: row.name }),
        message: t("dialog.message.delete", { what: row.name }),
        variant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          deleteStakeholderGroup(
            row,
            () => {
              dispatch(confirmDialogActions.closeDialog());
              refreshTable();
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

  const handleOnCreateUpdateModalSaved = (
    response: AxiosResponse<StakeholderGroup>
  ) => {
    if (!rowToUpdate) {
      dispatch(
        alertActions.addSuccess(
          // t('terms.stakeholderGroup')
          t("toastr.success.added", {
            what: response.data.name,
            type: t("terms.stakeholderGroup").toLowerCase(),
          })
        )
      );
    }

    closeCreateUpdateModal();
    refreshTable();
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(stakeholderGroups || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={stakeholderGroups ? stakeholderGroups.meta.count : 0}
          pagination={paginationQuery}
          sortBy={sortByQuery}
          handlePaginationChange={handlePaginationChange}
          handleSortChange={handleSortChange}
          onCollapse={collapseRow}
          columns={columns}
          rows={rows}
          // actions={actions}
          isLoading={isFetching}
          loadingVariant="skeleton"
          fetchError={fetchError}
          clearAllFilters={handleOnClearAllFilters}
          filtersApplied={
            Array.from(filtersValue.values()).reduce(
              (previous, current) => [...previous, ...current],
              []
            ).length > 0
          }
          toolbarToggle={
            <AppTableToolbarToggleGroup
              options={filters}
              filtersValue={filtersValue}
              onDeleteFilter={handleOnDeleteFilter}
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
                  aria-label="create-stakeholder-group"
                  variant={ButtonVariant.primary}
                  onClick={openCreateModal}
                >
                  {t("actions.createNew")}
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          }
          noDataState={
            <NoDataEmptyState
              // t('terms.stakeholderGroups')
              title={t("composed.noDataStateTitle", {
                what: t("terms.stakeholderGroups").toLowerCase(),
              })}
              // t('terms.stakeholderGroup')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.stakeholderGroup").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>

      <Modal
        // t('dialog.title.update')
        // t('dialog.title.new')
        title={t(`dialog.title.${rowToUpdate ? "update" : "new"}`, {
          what: t("terms.stakeholderGroup").toLowerCase(),
        })}
        variant={ModalVariant.medium}
        isOpen={isCreateUpdateModalOpen}
        onClose={closeCreateUpdateModal}
      >
        <StakeholderGroupForm
          stakeholderGroup={rowToUpdate}
          onSaved={handleOnCreateUpdateModalSaved}
          onCancel={closeCreateUpdateModal}
        />
      </Modal>
    </>
  );
};
