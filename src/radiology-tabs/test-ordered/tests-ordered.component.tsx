import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  DataTable,
  DataTableSkeleton,
  Pagination,
  OverflowMenu,
  OverflowMenuItem,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
} from "@carbon/react";
import { useOrdersWorklist } from "../../hooks/useOrdersWorklist";
import styles from "./tests-ordered.scss";
import { Result } from "../work-list/work-list.resource";

interface RejectOrderOverflowMenuItemProps {
  order: Result;
}
import { formatDate, parseDate,showModal, usePagination } from "@openmrs/esm-framework";
import { useSearchResults } from "../../hooks/useSearchResults";

const RejectOrderMenuItem: React.FC<RejectOrderOverflowMenuItemProps> = ({
  order,
}) => {
  const handleRejectOrderModel = useCallback(() => {
    const dispose = showModal("reject-order-dialog", {
      closeModal: () => dispose(),
      order,
    });
  }, [order]);
  return (
    <OverflowMenuItem
      className={styles.rejectOrders}
      itemText="Rejected Order"
      onClick={handleRejectOrderModel}
      hasDivider
    />
  );
};
export const TestsOrdered: React.FC = () => {
  const { t } = useTranslation();
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);
  const { workListEntries, isLoading } = useOrdersWorklist("", "");
  const [searchString, setSearchString] = useState<string>("");

  const searchResults = useSearchResults(workListEntries, searchString);

  const {
    goTo,
    results: paginatedResults,
    currentPage,
  } = usePagination(searchResults, currentPageSize);

  const pageSizes = [10, 20, 30, 40, 50];
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    return paginatedResults
      ?.filter((item) => item.action === "NEW")
      .map((entry) => ({
        ...entry,
        id: entry.uuid,
        date: formatDate(parseDate(entry.dateActivated)),
        patient: entry.patient.display.split("-")[1],
        orderNumber: entry.orderNumber,
        accessionNumber: entry.accessionNumber,
        procedure: entry.concept.display,
        action: entry.action,
        status: entry.fulfillerStatus ?? "--",
        orderer: entry.orderer.display,
        urgency: entry.urgency,
        actions: (
          <OverflowMenu flipped={true}>
            <OverflowMenuItem
              itemText="Pick Request"
              onClick={() => "Pick Request"}
            />
            <RejectOrderMenuItem order={entry} />
          </OverflowMenu>
        ),
      }));
  }, [paginatedResults]);

  const tableColumns = [
    { id: 0, header: t("date", "Date"), key: "date" },
    { id: 1, header: t("orderNumber", "Order Number"), key: "orderNumber" },
    { id: 2, header: t("patient", "Patient"), key: "patient" },
    { id: 4, header: t("procedure", "Procedure"), key: "procedure" },
    { id: 5, header: t("action", "Action"), key: "action" },
    { id: 6, header: t("status", "Status"), key: "status" },
    { id: 8, header: t("orderer", "Orderer"), key: "orderer" },
    { id: 9, header: t("urgency", "Urgency"), key: "urgency" },
    { id: 10, header: t("actions", "Actions"), key: "actions" },
  ];

  return isLoading ? (
    <DataTableSkeleton />
  ) : (
    <div>
      <DataTable
        rows={rows}
        headers={tableColumns}
        useZebraStyles
        overflowMenuOnHover={true}
      >
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <>
            <TableContainer>
              <TableToolbar
                style={{
                  position: "static",
                  height: "3rem",
                  overflow: "visible",
                  margin: 0,
                  // TODO: add background color to the toolbar
                }}
              >
                <TableToolbarContent style={{ margin: 0 }}>
                  <TableToolbarSearch
                    style={{ backgroundColor: "#f4f4f4" }}
                    onChange={(event) => setSearchString(event.target.value)}
                  />
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <TableRow {...getRowProps({ row })}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                      {expandedRows.has(row.id) && (
                        <TableRow>
                          <TableCell
                            colSpan={tableColumns.length + 1}
                          ></TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                forwardText="Next page"
                backwardText="Previous page"
                page={currentPage}
                pageSize={currentPageSize}
                pageSizes={pageSizes}
                totalItems={workListEntries?.length}
                onChange={({ pageSize, page }) => {
                  if (pageSize !== currentPageSize) {
                    setCurrentPageSize(pageSize);
                  }
                  if (page !== currentPage) {
                    goTo(page);
                  }
                }}
              />
            </TableContainer>
          </>
        )}
      </DataTable>
    </div>
  );
};
