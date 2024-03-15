import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Information, Microscope, TrashCan } from "@carbon/react/icons";

import {
  DataTable,
  DataTableSkeleton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Layer,
  Tag,
  Button,
  Tile,
  DatePicker,
  DatePickerInput,
  Tooltip,
} from "@carbon/react";
import { Result } from "./work-list.resource";
import styles from "./work-list.scss";
import {
  ConfigurableLink,
  formatDate,
  parseDate,
  showModal,
  usePagination,
  showSnackbar,
  showNotification,
  openmrsFetch,
  restBaseUrl,
} from "@openmrs/esm-framework";
import { launchOverlay } from "../../components/overlay/hook";
import Overlay from "../../components/overlay/overlay.component";
import ProcedureReportForm from "../../results/result-form.component";
import { getStatusColor } from "../../utils/functions";
import { useOrdersWorklist } from "../../hooks/useOrdersWorklist";

interface WorklistProps {
  fulfillerStatus: string;
}

interface ResultsOrderProps {
  order: Result;
  patientUuid: string;
}

interface RejectOrderProps {
  order: Result;
}

interface InstructionsProps {
  order: Result;
}

const WorkList: React.FC<WorklistProps> = ({ fulfillerStatus }) => {
  const { t } = useTranslation();

  const [activatedOnOrAfterDate, setActivatedOnOrAfterDate] = useState("");

  const { workListEntries, isLoading } = useOrdersWorklist(
    activatedOnOrAfterDate,
    fulfillerStatus
  );

  const pageSizes = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  const [currentPageSize, setPageSize] = useState(10);

  const {
    goTo,
    results: paginatedWorkListEntries,
    currentPage,
  } = usePagination(workListEntries, currentPageSize);

  const RejectOrder: React.FC<RejectOrderProps> = ({ order }) => {
    const launchRejectOrderModal = useCallback(() => {
      const dispose = showModal("reject-order-dialog", {
        closeModal: () => dispose(),
        order,
      });
    }, [order]);
    return (
      <Button
        kind="ghost"
        onClick={launchRejectOrderModal}
        renderIcon={(props) => <TrashCan size={16} {...props} />}
      />
    );
  };
  const StartOrder = ({ order }) => {
    const [buttonStyle, setButtonStyle] = useState({
      borderRadius: "80px",
      backgroundColor: "#cccccc",
      width: "10%",
      height: "2%",
    });
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);

    const handleStartClick = async () => {
      const body = {
        fulfillerComment: "",
        fulfillerStatus: "IN_PROGRESS",
      };

      try {
        const response = await openmrsFetch(
          `${restBaseUrl}/order/${order.uuid}/fulfillerdetails`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );

        if (response.status === 201) {
          // Check for successful POST
          showSnackbar({
            isLowContrast: true,
            title: t(
              "statusUpdatedSuccessfully",
              "Status updated successfully"
            ),
            kind: "success",
          });

          // Update button style on successful POST
          setButtonStyle({
            borderRadius: "80px",
            backgroundColor: "#90EE90",
            width: "10%",
            height: "2%",
          });

          setIsButtonDisabled(true);
        } else {
          const errorData = await response.json();
          showNotification({
            title: t("errorUpdatingStatus", "Error updating status"),
            kind: "error",
            critical: true,
            description: errorData.message || "Failed to update status",
          });
        }
      } catch (error) {
        showNotification({
          title: t("errorUpdatingStatus", "Error updating status"),
          kind: "error",
          critical: true,
          description: "Error updating status: " + error.message,
        });
      }
    };

    return (
      <div>
        <Button
          kind="primary"
          size="small"
          onClick={handleStartClick}
          style={buttonStyle}
          disabled={isButtonDisabled} // Set the button's disabled status
        >
          START
        </Button>
      </div>
    );
  };

  // get picked orders
  const columns = [
    { id: 0, header: t("date", "Date"), key: "date" },

    { id: 1, header: t("orderNumber", "Order Number"), key: "orderNumber" },
    { id: 2, header: t("patient", "Patient"), key: "patient" },
    { id: 4, header: t("procedure", "Procedure"), key: "procedure" },
    { id: 6, header: t("status", "Status"), key: "status" },
    { id: 8, header: t("orderer", "Orderer"), key: "orderer" },
    { id: 9, header: t("urgency", "Urgency"), key: "urgency" },
    { id: 10, header: t("start", "Start"), key: "start" },
    { id: 11, header: t("actions", "Actions"), key: "actions" },
  ];

  const tableRows = useMemo(() => {
    const ResultsOrder: React.FC<ResultsOrderProps> = ({
      order,
      patientUuid,
    }) => {
      return (
        <Button
          kind="ghost"
          onClick={() => {
            launchOverlay(
              t("procedureReportForm", "Procedure report form"),
              <ProcedureReportForm patientUuid={patientUuid} order={order} />
            );
          }}
          renderIcon={(props) => (
            <Tooltip align="top" label="Lab Results">
              <Microscope size={16} {...props} />
            </Tooltip>
          )}
        />
      );
    };
    const Instructions: React.FC<InstructionsProps> = ({ order }) => {
      const launchRadiologyInstructionsModal = useCallback(() => {
        const dispose = showModal("radiology-instructions-modal", {
          closeModal: () => dispose(),
          order,
        });
      }, [order]);
      return (
        <Button
          kind="ghost"
          onClick={launchRadiologyInstructionsModal}
          renderIcon={(props) => (
            <Tooltip align="top" label="Instructions">
              <Information size={16} {...props} />
            </Tooltip>
          )}
        />
      );
    };
    return paginatedWorkListEntries
      ?.filter((item) => item.fulfillerStatus === "IN_PROGRESS")
      .map((entry, index) => ({
        ...entry,
        id: entry.uuid,
        date: {
          content: (
            <>
              <span>{formatDate(parseDate(entry.dateActivated))}</span>
            </>
          ),
        },
        patient: {
          content: (
            <ConfigurableLink
              to={`\${openmrsSpaBase}/patient/${entry.patient.uuid}/chart/laboratory-orders`}
            >
              {entry.patient.display.split("-")[1]}
            </ConfigurableLink>
          ),
        },
        orderNumber: { content: <span>{entry.orderNumber}</span> },
        procedure: { content: <span>{entry.concept.display}</span> },
        action: { content: <span>{entry.action}</span> },
        status: {
          content: (
            <>
              <Tag>
                <span
                  className={styles.statusContainer}
                  style={{ color: `${getStatusColor(entry.fulfillerStatus)}` }}
                >
                  <span>{entry.fulfillerStatus}</span>
                </span>
              </Tag>
            </>
          ),
        },
        orderer: { content: <span>{entry.orderer.display}</span> },
        orderType: { content: <span>{entry?.orderType?.display}</span> },
        urgency: { content: <span>{entry.urgency}</span> },
        start: {
          content: (
            <>
              <StartOrder order={paginatedWorkListEntries[index]} />
            </>
          ),
        },
        actions: {
          content: (
            <>
              <Instructions order={entry} />
              <ResultsOrder
                patientUuid={entry.patient.uuid}
                order={paginatedWorkListEntries[index]}
              />
              <RejectOrder order={paginatedWorkListEntries[index]} />
            </>
          ),
        },
      }));
  }, [paginatedWorkListEntries, t]);

  if (isLoading) {
    return <DataTableSkeleton role="progressbar" />;
  }

  if (paginatedWorkListEntries?.length >= 0) {
    return (
      <>
        <div>
          <div className={styles.headerBtnContainer}></div>
          <DataTable rows={tableRows} headers={columns} useZebraStyles>
            {({
              rows,
              headers,
              getHeaderProps,
              getTableProps,
              getRowProps,
              onInputChange,
            }) => (
              <TableContainer className={styles.tableContainer}>
                <TableToolbar
                  style={{
                    position: "static",
                    height: "3rem",
                    overflow: "visible",
                    backgroundColor: "color",
                  }}
                >
                  <TableToolbarContent>
                    <Layer style={{ margin: "5px" }}>
                      <DatePicker dateFormat="Y-m-d" datePickerType="single">
                        <DatePickerInput
                          labelText={""}
                          id="activatedOnOrAfterDate"
                          placeholder="YYYY-MM-DD"
                          onChange={(event) => {
                            setActivatedOnOrAfterDate(event.target.value);
                          }}
                          type="date"
                          value={activatedOnOrAfterDate}
                        />
                      </DatePicker>
                    </Layer>
                    <Layer>
                      <TableToolbarSearch
                        onChange={onInputChange}
                        placeholder={t("searchThisList", "Search this list")}
                        size="sm"
                      />
                    </Layer>
                  </TableToolbarContent>
                </TableToolbar>
                <Table
                  {...getTableProps()}
                  className={styles.activePatientsTable}
                >
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader {...getHeaderProps({ header })}>
                          {header.header?.content ?? header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, index) => {
                      return (
                        <React.Fragment key={row.id}>
                          <TableRow {...getRowProps({ row })} key={row.id}>
                            {row.cells.map((cell) => (
                              <TableCell key={cell.id}>
                                {cell.value?.content ?? cell.value}
                              </TableCell>
                            ))}
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
                {rows.length === 0 ? (
                  <div className={styles.tileContainer}>
                    <Tile className={styles.tile}>
                      <div className={styles.tileContent}>
                        <p className={styles.content}>
                          {t(
                            "noWorklistsToDisplay",
                            "No worklists orders to display"
                          )}
                        </p>
                      </div>
                    </Tile>
                  </div>
                ) : null}
                <Pagination
                  forwardText="Next page"
                  backwardText="Previous page"
                  page={currentPage}
                  pageSize={currentPageSize}
                  pageSizes={pageSizes}
                  totalItems={workListEntries?.length}
                  className={styles.pagination}
                  onChange={({ pageSize, page }) => {
                    if (pageSize !== currentPageSize) {
                      setPageSize(pageSize);
                    }
                    if (page !== currentPage) {
                      goTo(page);
                    }
                  }}
                />
              </TableContainer>
            )}
          </DataTable>
        </div>
        <Overlay />
      </>
    );
  }
};

export default WorkList;
