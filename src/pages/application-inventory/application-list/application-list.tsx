import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useSelectionState } from "@konveyor/lib-ui";

import {
  Button,
  ButtonVariant,
  DropdownItem,
  Modal,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  ToolbarChip,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  cellWidth,
  expandable,
  IAction,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  ISeparator,
  sortable,
  TableText,
} from "@patternfly/react-table";
import { PencilAltIcon, TagIcon } from "@patternfly/react-icons";

import { useDispatch } from "react-redux";
import { alertActions } from "store/alert";
import { confirmDialogActions } from "store/confirmDialog";

import {
  ApplicationToolbarToggleGroup,
  AppPlaceholder,
  AppTableWithControls,
  ConditionalRender,
  NoDataEmptyState,
  StatusIconAssessment,
} from "shared/components";
import {
  useTableControls,
  useAssessApplication,
  useMultipleFetch,
  useFetch,
  useEntityModal,
  useDelete,
  useApplicationToolbarFilter,
} from "shared/hooks";

import { formatPath, Paths } from "Paths";
import { ApplicationFilterKey } from "Constants";

import {
  Application,
  ApplicationPage,
  Assessment,
  SortByQuery,
} from "api/models";
import {
  ApplicationSortBy,
  ApplicationSortByQuery,
  deleteApplication,
  deleteAssessment,
  deleteReview,
  getApplications,
  getAssessments,
} from "api/rest";
import { applicationPageMapper } from "api/apiUtils";
import { getAxiosErrorMessage } from "utils/utils";

import { ApplicationForm } from "./components/application-form";
import ApplicationDependenciesForm from "./components/application-dependencies-form";

import { ApplicationAssessment } from "./components/application-assessment";
import { ApplicationBusinessService } from "./components/application-business-service";
import { ApplicationListExpandedArea } from "./components/application-list-expanded-area";
import { ImportApplicationsForm } from "./components/import-applications-form";
import { KebabDropdown } from "./components/kebab-dropdown/kebab-dropdown";

const toSortByQuery = (
  sortBy?: SortByQuery
): ApplicationSortByQuery | undefined => {
  if (!sortBy) {
    return undefined;
  }

  let field: ApplicationSortBy;
  switch (sortBy.index) {
    case 2:
      field = ApplicationSortBy.NAME;
      break;
    case 6:
      field = ApplicationSortBy.REVIEW;
      break;
    case 7:
      field = ApplicationSortBy.TAGS;
      break;
    default:
      return undefined;
  }

  return {
    field,
    direction: sortBy.direction,
  };
};

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

const searchAppAssessment = (id: number) => {
  const result = getAssessments({ applicationId: id }).then(({ data }) =>
    data[0] ? data[0] : undefined
  );
  return result;
};

export const ApplicationList: React.FC = () => {
  // i18
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();

  // Router
  const history = useHistory();

  // Toolbar filters
  const {
    filters: filtersValue,
    isPresent: areFiltersPresent,
    addFilter,
    setFilter,
    clearAllFilters,
  } = useApplicationToolbarFilter();

  // Table data
  const {
    paginationQuery,
    sortByQuery,
    handlePaginationChange,
    handleSortChange,
  } = useTableControls({
    sortByQuery: { direction: "asc", index: 2 },
  });

  const fetchApplications = useCallback(() => {
    const nameVal = filtersValue.get(ApplicationFilterKey.NAME);
    const descriptionVal = filtersValue.get(ApplicationFilterKey.DESCRIPTION);
    const serviceVal = filtersValue.get(ApplicationFilterKey.BUSINESS_SERVICE);
    const tagVal = filtersValue.get(ApplicationFilterKey.TAG);
    return getApplications(
      {
        name: nameVal?.map((f) => f.key),
        description: descriptionVal?.map((f) => f.key),
        businessService: serviceVal?.map((f) => f.key),
        tag: tagVal?.map((f) => f.key),
      },
      paginationQuery,
      toSortByQuery(sortByQuery)
    );
  }, [filtersValue, paginationQuery, sortByQuery]);

  const {
    data: page,
    isFetching,
    fetchError,
    requestFetch: refreshTable,
  } = useFetch<ApplicationPage>({
    defaultIsFetching: true,
    onFetch: fetchApplications,
  });

  const applications = useMemo(() => {
    return page ? applicationPageMapper(page) : undefined;
  }, [page]);

  useEffect(() => {
    refreshTable();
  }, [filtersValue, paginationQuery, sortByQuery, refreshTable]);

  // Create and update modal
  const {
    isOpen: isApplicationModalOpen,
    data: applicationToUpdate,
    create: openCreateApplicationModal,
    update: openUpdateApplicationModal,
    close: closeApplicationModal,
  } = useEntityModal<Application>();

  const onApplicationModalSaved = (response: AxiosResponse<Application>) => {
    if (!applicationToUpdate) {
      dispatch(
        alertActions.addSuccess(
          // t('terms.application')
          t("toastr.success.added", {
            what: response.data.name,
            type: t("terms.application").toLowerCase(),
          })
        )
      );
    }

    closeApplicationModal();
    refreshTable();
  };

  // Delete
  const { requestDelete: requestDeleteApplication } = useDelete<Application>({
    onDelete: (t: Application) => deleteApplication(t.id!),
  });

  // Dependencies modal
  const {
    isOpen: isDependenciesModalOpen,
    data: applicationToManageDependencies,
    update: openDependenciesModal,
    close: closeDependenciesModal,
  } = useEntityModal<Application>();

  // Application import modal
  const [
    isApplicationImportModalOpen,
    setIsApplicationImportModalOpen,
  ] = useState(false);

  // Table's assessments
  const {
    getData: getApplicationAssessment,
    isFetching: isFetchingApplicationAssessment,
    fetchError: fetchErrorApplicationAssessment,
    fetchCount: fetchCountApplicationAssessment,
    triggerFetch: fetchApplicationsAssessment,
  } = useMultipleFetch<number, Assessment | undefined>({
    onFetchPromise: searchAppAssessment,
  });

  useEffect(() => {
    if (applications) {
      fetchApplicationsAssessment(applications.data.map((f) => f.id!));
    }
  }, [applications, fetchApplicationsAssessment]);

  // Create assessment
  const {
    assessApplication,
    inProgress: isApplicationAssessInProgress,
  } = useAssessApplication();

  // Expand, select rows
  const {
    isItemSelected: isRowExpanded,
    toggleItemSelected: toggleRowExpanded,
  } = useSelectionState<Application>({
    items: applications?.data || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const {
    isItemSelected: isRowSelected,
    toggleItemSelected: toggleRowSelected,
    selectedItems: selectedRows,
  } = useSelectionState<Application>({
    items: applications?.data || [],
    isEqual: (a, b) => a.id === b.id,
  });

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(20)],
      cellFormatters: [expandable],
    },
    { title: t("terms.description"), transforms: [cellWidth(25)] },
    { title: t("terms.businessService"), transforms: [cellWidth(20)] },
    { title: t("terms.assessment"), transforms: [cellWidth(10)] },
    { title: t("terms.review"), transforms: [sortable, cellWidth(10)] },
    { title: t("terms.tagCount"), transforms: [sortable, cellWidth(10)] },
    {
      title: "",
      props: {
        className: "pf-c-table__inline-edit-action",
      },
    },
  ];

  const rows: IRow[] = [];
  applications?.data.forEach((item) => {
    const isExpanded = isRowExpanded(item);
    const isSelected = isRowSelected(item);

    rows.push({
      [ENTITY_FIELD]: item,
      isOpen: isExpanded,
      selected: isSelected,
      cells: [
        {
          title: <TableText wrapModifier="truncate">{item.name}</TableText>,
        },
        {
          title: (
            <TableText wrapModifier="truncate">{item.description}</TableText>
          ),
        },
        {
          title: (
            <TableText wrapModifier="truncate">
              {item.businessService && (
                <ApplicationBusinessService id={item.businessService} />
              )}
            </TableText>
          ),
        },
        {
          title: (
            <ApplicationAssessment
              assessment={getApplicationAssessment(item.id!)}
              isFetching={isFetchingApplicationAssessment(item.id!)}
              fetchError={fetchErrorApplicationAssessment(item.id!)}
              fetchCount={fetchCountApplicationAssessment(item.id!)}
            />
          ),
        },
        {
          title: item.review ? (
            <StatusIconAssessment status="Completed" />
          ) : (
            <StatusIconAssessment status="NotStarted" />
          ),
        },
        {
          title: (
            <>
              <TagIcon /> {item.tags ? item.tags.length : 0}
            </>
          ),
        },
        {
          title: (
            <div className="pf-c-inline-edit__action pf-m-enable-editable">
              <Button
                type="button"
                variant="plain"
                onClick={() => openUpdateApplicationModal(item)}
              >
                <PencilAltIcon />
              </Button>
            </div>
          ),
        },
      ],
    });

    rows.push({
      parent: rows.length - 1,
      fullWidth: false,
      cells: [
        <div className="pf-c-table__expandable-row-content">
          <ApplicationListExpandedArea application={item} />
        </div>,
      ],
    });
  });

  const actionResolver = (rowData: IRowData): (IAction | ISeparator)[] => {
    const row: Application = getRow(rowData);
    if (!row) {
      return [];
    }

    const actions: (IAction | ISeparator)[] = [];

    if (getApplicationAssessment(row.id!)) {
      actions.push({
        title: t("actions.discardAssessment"),
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: Application = getRow(rowData);
          discardAssessmentRow(row);
        },
      });
    }

    actions.push(
      {
        title: t("actions.manageDependencies"),
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: Application = getRow(rowData);
          openDependenciesModal(row);
        },
      },
      {
        title: t("actions.delete"),
        onClick: (
          event: React.MouseEvent,
          rowIndex: number,
          rowData: IRowData
        ) => {
          const row: Application = getRow(rowData);
          deleteRow(row);
        },
      }
    );

    return actions;
  };

  // Row actions
  const collapseRow = (
    event: React.MouseEvent,
    rowIndex: number,
    isOpen: boolean,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleRowExpanded(row);
  };

  const selectRow = (
    event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    rowIndex: number,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleRowSelected(row);
  };

  const deleteRow = (row: Application) => {
    dispatch(
      confirmDialogActions.openDialog({
        // t("terms.application")
        title: t("dialog.title.delete", {
          what: t("terms.application").toLowerCase(),
        }),
        titleIconVariant: "warning",
        message: t("dialog.message.delete"),
        confirmBtnVariant: ButtonVariant.danger,
        confirmBtnLabel: t("actions.delete"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());
          requestDeleteApplication(
            row,
            () => {
              dispatch(confirmDialogActions.closeDialog());
              if (applications?.data.length === 1) {
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

  const discardAssessmentRow = (row: Application) => {
    dispatch(
      confirmDialogActions.openDialog({
        title: "Discard assessment?",
        titleIconVariant: "warning",
        message: (
          <span>
            The assessment for <strong>{row.name}</strong> will be discarded, as
            well as the review result. Do you wish to continue?
          </span>
        ),
        confirmBtnVariant: ButtonVariant.primary,
        confirmBtnLabel: t("actions.continue"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.processing());

          Promise.all([row.review ? deleteReview(row.review.id!) : undefined])
            .then(() => {
              const assessment = getApplicationAssessment(row.id!);
              return Promise.all([
                assessment ? deleteAssessment(assessment.id!) : undefined,
              ]);
            })
            .then(() => {
              dispatch(confirmDialogActions.closeDialog());
              dispatch(
                alertActions.addSuccess(
                  t("toastr.success.assessmentDiscarded", {
                    application: row.name,
                  })
                )
              );
              refreshTable();
            })
            .catch((error) => {
              dispatch(confirmDialogActions.closeDialog());
              dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
            });
        },
      })
    );
  };

  // Toolbar actions
  const assessSelectedRows = () => {
    if (selectedRows.length !== 1) {
      const msg = "The number of applications to be assess must be 1";
      dispatch(alertActions.addDanger(msg));
      return;
    }

    const row = selectedRows[0];
    assessApplication(
      row,
      (assessment: Assessment) => {
        const redirectToAssessment = () => {
          history.push(
            formatPath(Paths.applicationInventory_assessment, {
              assessmentId: assessment.id,
            })
          );
        };

        if (assessment.status === "COMPLETE") {
          dispatch(
            confirmDialogActions.openDialog({
              // t("terms.assessment")
              title: t("composed.editQuestion", {
                what: t("terms.assessment").toLowerCase(),
              }),
              titleIconVariant: "warning",
              message: t("message.overrideAssessmentConfirmation"),
              confirmBtnVariant: ButtonVariant.primary,
              confirmBtnLabel: t("actions.continue"),
              cancelBtnLabel: t("actions.cancel"),
              onConfirm: () => {
                dispatch(confirmDialogActions.closeDialog());
                redirectToAssessment();
              },
            })
          );
        } else {
          redirectToAssessment();
        }
      },
      (error) => {
        dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
      }
    );
  };

  const reviewSelectedRows = () => {
    if (selectedRows.length !== 1) {
      const msg = "The number of applications to be reviewed must be 1";
      dispatch(alertActions.addDanger(msg));
      return;
    }

    const row = selectedRows[0];
    const assessment = getApplicationAssessment(row.id!);
    if (!assessment) {
      console.log("You must assess the application before reviewing it");
      return;
    }

    history.push(
      formatPath(Paths.applicationInventory_review, {
        applicationId: row.id,
      })
    );
  };

  // Flags
  const isReviewBtnDisabled = (row: Application) => {
    const assessment = getApplicationAssessment(row.id!);
    return assessment === undefined || assessment.status !== "COMPLETE";
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("composed.applicationInventory")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(applications || fetchError)}
          then={<AppPlaceholder />}
        >
          <AppTableWithControls
            count={applications ? applications.meta.count : 0}
            pagination={paginationQuery}
            sortBy={sortByQuery}
            onPaginationChange={handlePaginationChange}
            onSort={handleSortChange}
            onCollapse={collapseRow}
            onSelect={selectRow}
            canSelectAll={false}
            cells={columns}
            rows={rows}
            actionResolver={actionResolver}
            isLoading={isFetching}
            loadingVariant="skeleton"
            fetchError={fetchError}
            toolbarClearAllFilters={clearAllFilters}
            filtersApplied={areFiltersPresent}
            toolbarToggle={
              <ApplicationToolbarToggleGroup
                value={filtersValue as Map<ApplicationFilterKey, ToolbarChip[]>}
                addFilter={addFilter}
                setFilter={setFilter}
              />
            }
            toolbar={
              <>
                <ToolbarGroup variant="button-group">
                  <ToolbarItem>
                    <Button
                      type="button"
                      aria-label="create-application"
                      variant={ButtonVariant.primary}
                      onClick={openCreateApplicationModal}
                    >
                      {t("actions.createNew")}
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      type="button"
                      aria-label="assess-application"
                      variant={ButtonVariant.primary}
                      onClick={assessSelectedRows}
                      isDisabled={
                        selectedRows.length !== 1 ||
                        isApplicationAssessInProgress
                      }
                      isLoading={isApplicationAssessInProgress}
                    >
                      {t("actions.assess")}
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      type="button"
                      aria-label="review-application"
                      variant={ButtonVariant.primary}
                      onClick={reviewSelectedRows}
                      isDisabled={
                        selectedRows.length !== 1 ||
                        isReviewBtnDisabled(selectedRows[0])
                      }
                    >
                      {t("actions.review")}
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <KebabDropdown
                      dropdownItems={[
                        <DropdownItem
                          key="import-applications"
                          component="button"
                          onClick={() => setIsApplicationImportModalOpen(true)}
                        >
                          {t("actions.import")}
                        </DropdownItem>,
                        <DropdownItem
                          key="manage-application-imports"
                          onClick={() => {
                            history.push(
                              Paths.applicationInventory_manageImports
                            );
                          }}
                        >
                          {t("actions.manageImports")}
                        </DropdownItem>,
                      ]}
                    />
                  </ToolbarItem>
                </ToolbarGroup>
              </>
            }
            noDataState={
              <NoDataEmptyState
                // t('terms.applications')
                title={t("composed.noDataStateTitle", {
                  what: t("terms.applications").toLowerCase(),
                })}
                // t('terms.application')
                description={
                  t("composed.noDataStateBody", {
                    what: t("terms.application").toLowerCase(),
                  }) + "."
                }
              />
            }
          />
        </ConditionalRender>
      </PageSection>

      <Modal
        // t('dialog.title.update')
        // t('dialog.title.new')
        // t('terms.application')
        title={t(`dialog.title.${applicationToUpdate ? "update" : "new"}`, {
          what: t("terms.application").toLowerCase(),
        })}
        variant="medium"
        isOpen={isApplicationModalOpen}
        onClose={closeApplicationModal}
      >
        <ApplicationForm
          application={applicationToUpdate}
          onSaved={onApplicationModalSaved}
          onCancel={closeApplicationModal}
        />
      </Modal>

      <Modal
        isOpen={isDependenciesModalOpen}
        variant="medium"
        title={t("composed.manageDependenciesFor", {
          what: applicationToManageDependencies?.name,
        })}
        onClose={closeDependenciesModal}
      >
        {applicationToManageDependencies && (
          <ApplicationDependenciesForm
            application={applicationToManageDependencies}
            onCancel={closeDependenciesModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={isApplicationImportModalOpen}
        variant="medium"
        title="Import application file"
        onClose={() => setIsApplicationImportModalOpen((current) => !current)}
      >
        <ImportApplicationsForm
          onSaved={() => {
            setIsApplicationImportModalOpen(false);
            refreshTable();
          }}
        />
      </Modal>
    </>
  );
};
