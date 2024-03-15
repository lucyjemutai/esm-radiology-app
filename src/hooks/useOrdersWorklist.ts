import { openmrsFetch } from "@openmrs/esm-framework";
import useSWR from "swr";
import { Result } from "../radiology-tabs/work-list/work-list.resource";

export function useOrdersWorklist(
  activatedOnOrAfterDate: string,
  fulfillerStatus: string
) {
  const radiologyOrderType = "4237a01f-29c5-4167-9d8e-96d6e590aa33";
  const responseFormat =
    "custom:(uuid,orderNumber,laterality,numberOfRepeats,instructions,frequency,patient:ref,concept:(uuid,display,conceptClass),action,careSetting,orderer:ref,urgency,instructions,commentToFulfiller,display,fulfillerStatus,dateStopped)";
  const orderTypeParam = `orderTypes=${radiologyOrderType}&activatedOnOrAfterDate=${activatedOnOrAfterDate}&isStopped=false&fulfillerStatus=${fulfillerStatus}&v=${responseFormat}`;
  const apiUrl = `/ws/rest/v1/order?${orderTypeParam}`;

  const { data, error, isLoading } = useSWR<
    { data: { results: Array<Result> } },
    Error
  >(apiUrl, openmrsFetch);

  const orders = data?.data?.results?.filter((order) => {
    if (fulfillerStatus === "") {
      return (
        order.fulfillerStatus === null &&
        order.dateStopped === null &&
        order.action === "NEW" &&
        order.concept.conceptClass.uuid ===
          "8caa332c-efe4-4025-8b18-3398328e1323"
      );
    } else if (fulfillerStatus === "IN_PROGRESS") {
      return (
        order.fulfillerStatus === "IN_PROGRESS" &&
        order.dateStopped === null &&
        order.action !== "DISCONTINUE" &&
        order.concept.conceptClass.uuid ===
          "8caa332c-efe4-4025-8b18-3398328e1323"
      );
    } else if (fulfillerStatus === "DECLINED") {
      return (
        order.fulfillerStatus === "DECLINED" &&
        order.dateStopped === null &&
        order.action !== "DISCONTINUE" &&
        order.concept.conceptClass.uuid ===
          "8caa332c-efe4-4025-8b18-3398328e1323"
      );
    } else if (fulfillerStatus === "COMPLETED") {
      return (
        order.fulfillerStatus === "COMPLETED" &&
        order.dateStopped === null &&
        order.action !== "DISCONTINUE" &&
        order.concept.conceptClass.uuid ===
          "8caa332c-efe4-4025-8b18-3398328e1323"
      );
    }
  });

  return {
    workListEntries: orders?.length > 0 ? orders : [],
    isLoading,
    isError: error,
  };
}
