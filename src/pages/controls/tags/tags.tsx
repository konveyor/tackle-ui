import React, { useCallback, useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@konveyor/lib-ui";

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
  AppTableToolbarToggleGroup,
  NoDataEmptyState,
  SearchFilter,
  Color,
} from "shared/components";
import {
  useTableControls,
  useDeleteTagType,
  useFetchTagTypes,
  useDeleteTag,
  useEntityModal,
} from "shared/hooks";

import { getAxiosErrorMessage } from "utils/utils";
import { TagTypeSortBy, TagTypeSortByQuery } from "api/rest";
import { SortByQuery, Tag, TagType } from "api/models";

import { TagTable } from "./components/tag-table";
import { TagTypeForm } from "./components/tag-type-form";
import { TagForm } from "./components/tag-form";

enum FilterKey {
  TAG_TYPE = "tagType",
  TAG = "tags",
}

const toSortByQuery = (
  sortBy?: SortByQuery
): TagTypeSortByQuery | undefined => {
  if (!sortBy) {
    return undefined;
  }

  let field: TagTypeSortBy;
  switch (sortBy.index) {
    case 1:
      field = TagTypeSortBy.NAME;
      break;
    case 2:
      field = TagTypeSortBy.RANK;
      break;
    case 3:
      field = TagTypeSortBy.COLOR;
      break;
    case 4:
      field = TagTypeSortBy.TAGS_COUNT;
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

const getRow = (rowData: IRowData): TagType => {
  return rowData[ENTITY_FIELD];
};

export const Tags: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const filters = [
    {
      key: FilterKey.TAG_TYPE,
      name: t("terms.tagType"),
    },
    {
      key: FilterKey.TAG,
      name: t("terms.tagName"),
    },
  ];
  const [filtersValue, setFiltersValue] = useState<Map<FilterKey, string[]>>(
    new Map([])
  );

  const {
    isOpen: isTagTypeModalOpen,
    data: tagTypeToUpdate,
    create: openCreateTagTypeModal,
    update: openUpdateTagTypeModal,
    close: closeTagTypeModal,
  } = useEntityModal<TagType>();

  const {
    isOpen: isTagModalOpen,
    data: tagToUpdate,
    create: openCreateTagModal,
    update: openUpdateTagModal,
    close: closeTagModal,
  } = useEntityModal<Tag>();

  const { deleteTagType } = useDeleteTagType();
  const { deleteTag } = useDeleteTag();

  const { tagTypes, isFetching, fetchError, fetchTagTypes } = useFetchTagTypes(
    true
  );

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
  } = useSelectionState<TagType>({
    items: tagTypes?.data || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const refreshTable = useCallback(() => {
    fetchTagTypes(
      {
        tagTypes: filtersValue.get(FilterKey.TAG_TYPE),
        tags: filtersValue.get(FilterKey.TAG),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchTagTypes]);

  useEffect(() => {
    fetchTagTypes(
      {
        tagTypes: filtersValue.get(FilterKey.TAG_TYPE),
        tags: filtersValue.get(FilterKey.TAG),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery, fetchTagTypes]);

  //

  const editTagFromTable = (row: Tag) => {
    openUpdateTagModal(row);
  };

  const deleteTagFromTable = (row: Tag) => {
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.tag")
        title: t("dialog.title.delete", { what: t("terms.tag").toLowerCase() }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          deleteTag(
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

  //

  const columns: ICell[] = [
    {
      title: t("terms.tagType"),
      transforms: [sortable],
      cellFormatters: [expandable],
    },
    { title: t("terms.rank"), transforms: [sortable] },
    {
      title: t("terms.color"),
      transforms: [],
    },
    {
      title: t("terms.tagCount"),
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
  tagTypes?.data.forEach((item) => {
    const isExpanded = isItemExpanded(item);
    rows.push({
      [ENTITY_FIELD]: item,
      isOpen: (item.tags || []).length > 0 ? isExpanded : undefined,
      cells: [
        {
          title: item.name,
        },
        {
          title: item.rank,
        },
        {
          title: <>{item.colour && <Color hex={item.colour} />}</>,
        },
        {
          title: item.tags ? item.tags.length : 0,
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
        fullWidth: true,
        noPadding: true,
        cells: [
          {
            title: (
              <div>
                <TagTable
                  tagType={item}
                  onEdit={editTagFromTable}
                  onDelete={deleteTagFromTable}
                />
              </div>
            ),
          },
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

  const editRow = (row: TagType) => {
    openUpdateTagTypeModal(row);
  };

  const deleteRow = (row: TagType) => {
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.tagType")
        title: t("dialog.title.delete", {
          what: t("terms.tagType").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          deleteTagType(
            row,
            () => {
              dispatch(confirmDialogActions.closeDialog());
              if (tagTypes?.data.length === 1) {
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

  const handleOnTagTypeFormSaved = (response: AxiosResponse<TagType>) => {
    if (!tagTypeToUpdate) {
      dispatch(
        alertActions.addSuccess(
          // t('terms.tagType')
          t("toastr.success.added", {
            what: response.data.name,
            type: t("terms.tagType").toLowerCase(),
          })
        )
      );
    }

    closeTagTypeModal();
    refreshTable();
  };

  const handleOnTagFormSaved = (response: AxiosResponse<Tag>) => {
    if (!tagToUpdate) {
      dispatch(
        alertActions.addSuccess(
          // t('terms.tag')
          t("toastr.success.added", {
            what: response.data.name,
            type: t("terms.tag").toLowerCase(),
          })
        )
      );
    }

    closeTagModal();
    refreshTable();
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(tagTypes || fetchError)}
        then={<AppPlaceholder />}
      >
        <AppTableWithControls
          count={tagTypes ? tagTypes.meta.count : 0}
          pagination={paginationQuery}
          sortBy={sortByQuery}
          onPaginationChange={handlePaginationChange}
          onSort={handleSortChange}
          onCollapse={collapseRow}
          cells={columns}
          rows={rows}
          // actions={actions}
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
                  aria-label="create-tag"
                  variant={ButtonVariant.primary}
                  onClick={openCreateTagModal}
                >
                  {t("actions.createTag")}
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <Button
                  type="button"
                  aria-label="create-tag-type"
                  variant={ButtonVariant.secondary}
                  onClick={openCreateTagTypeModal}
                >
                  {t("actions.createTagType")}
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          }
          noDataState={
            <NoDataEmptyState
              // t('terms.tagTypes')
              title={t("composed.noDataStateTitle", {
                what: t("terms.tagTypes").toLowerCase(),
              })}
              // t('terms.stakeholderGroup')
              description={
                t("composed.noDataStateBody", {
                  what: t("terms.tagType").toLowerCase(),
                }) + "."
              }
            />
          }
        />
      </ConditionalRender>

      <Modal
        // t('dialog.title.update')
        // t('dialog.title.new')
        // t('terms.tagType')
        title={t(`dialog.title.${tagTypeToUpdate ? "update" : "new"}`, {
          what: t("terms.tagType").toLowerCase(),
        })}
        variant={ModalVariant.medium}
        isOpen={isTagTypeModalOpen}
        onClose={closeTagTypeModal}
      >
        <TagTypeForm
          tagType={tagTypeToUpdate}
          onSaved={handleOnTagTypeFormSaved}
          onCancel={closeTagTypeModal}
        />
      </Modal>

      <Modal
        // t('dialog.title.update')
        // t('dialog.title.new')
        // t('terms.tag')
        title={t(`dialog.title.${tagTypeToUpdate ? "update" : "new"}`, {
          what: t("terms.tag").toLowerCase(),
        })}
        variant={ModalVariant.medium}
        isOpen={isTagModalOpen}
        onClose={closeTagModal}
      >
        <TagForm
          tag={tagToUpdate}
          onSaved={handleOnTagFormSaved}
          onCancel={closeTagModal}
        />
      </Modal>
    </>
  );
};
