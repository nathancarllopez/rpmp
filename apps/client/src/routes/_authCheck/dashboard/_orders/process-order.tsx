import { useState } from "react";
import { Button, Center, Stack, Stepper, Text, Title } from "@mantine/core";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { orderHeadersOptions } from "../../../../tanstack-query/queries/orderHeaders";
import { proteinsOptions } from "../../../../tanstack-query/queries/proteins";
import { flavorsOptions } from "../../../../tanstack-query/queries/flavors";
import { proteinsAndFlavorsOptions } from "../../../../tanstack-query/queries/proteinsWithFlavors";
import { backstockOptions } from "../../../../tanstack-query/queries/backstock";
import { veggieCarbInfoOptions } from "../../../../tanstack-query/queries/veggieCarbInfo";
import { pullListOptions } from "../../../../tanstack-query/queries/pullList";
import LoadingScreen from "../../../../components/misc/LoadingScreen";
import NavigationBlockAlert from "../../../../components/misc/NavigationBlockAlert";
import { OrderDropzone } from "../../../../components/orders/OrderDropzone";
import { OrderEditor } from "../../../../components/orders/OrderEditor";
import ReportDisplay from "../../../../components/orders/ReportDisplay";
import { resetBackstock } from "../../../../business-logic/resetBackstock";
import type { OrderReportInfo } from "../../../../types/types";

export const Route = createFileRoute(
  "/_authCheck/dashboard/_orders/process-order"
)({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(orderHeadersOptions());
    queryClient.ensureQueryData(proteinsOptions());
    queryClient.ensureQueryData(flavorsOptions());
    queryClient.ensureQueryData(proteinsAndFlavorsOptions());
    queryClient.ensureQueryData(backstockOptions());
    queryClient.ensureQueryData(veggieCarbInfoOptions());
    queryClient.ensureQueryData(pullListOptions());
  },
  pendingComponent: LoadingScreen,
  component: OrderProcessor,
});

function OrderProcessor() {
  const [active, setActive] = useState(0);
  const [orderReportInfo, setOrderReportInfo] = useState<OrderReportInfo>(() =>
    getBlankOrderReportInfo()
  );
  const [reportUrl, setReportUrl] = useState<string | undefined>(undefined);

  const resetCalculatedInfo = () =>
    setOrderReportInfo((curr) => {
      const { orderData } = curr;
      const blank = getBlankOrderReportInfo();

      return { ...blank, orderData };
    });

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => active > 1,
    withResolver: true,
  });

  const stepProps: Record<string, Record<string, string>> = {
    dropzone: { label: "Step 1", description: "Upload order sheet" },
    edit: { label: "Step 2", description: "Edit order upload" },
    display: { label: "Step 3", description: "Review order report" },
  };
  const numSteps = Object.keys(stepProps).length;

  const toNextStep = () =>
    setActive((curr) => Math.min(curr + 1, numSteps));
  const toPrevStep = () => setActive((curr) => Math.max(0, curr - 1));

  return (
    <Stack>
      <NavigationBlockAlert
        opened={status === "blocked"}
        proceed={proceed}
        reset={reset}
        text={{
          title: "Wait stop!",
          message: "If you leave now all will be lost!",
        }}
      />

      <Title>Process Order</Title>

      <Stepper active={active} allowNextStepsSelect={false}>
        <Stepper.Step {...stepProps.dropzone}>
          <OrderDropzone
            setOrderReportInfo={setOrderReportInfo}
            toNextStep={toNextStep}
          />
        </Stepper.Step>
        <Stepper.Step {...stepProps.edit}>
          {orderReportInfo.orderData.length > 0 ? (
            <OrderEditor
              orderReportInfo={orderReportInfo}
              setOrderReportInfo={setOrderReportInfo}
              setReportUrl={setReportUrl}
              toNextStep={toNextStep}
              toPrevStep={toPrevStep}
            />
          ) : (
            <Text>No order data provided</Text>
          )}
        </Stepper.Step>
        <Stepper.Step {...stepProps.display}>
          {reportUrl ? (
            <ReportDisplay
              orderReportInfo={orderReportInfo}
              resetCalculatedInfo={resetCalculatedInfo}
              reportUrl={reportUrl}
              setReportUrl={setReportUrl}
              toNextStep={toNextStep}
              toPrevStep={toPrevStep}
            />
          ) : (
            <Text>No report url provided</Text>
          )}
        </Stepper.Step>
        <Stepper.Completed>
          <Center mt={"md"}>
            <Title order={3}>Order processing complete!</Title>
          </Center>
        </Stepper.Completed>
      </Stepper>

      {/* This button is only for testing and will be removed for production */}
      <Button onClick={resetBackstock}>Reset Backstock</Button>
    </Stack>
  );
}

function getBlankOrderReportInfo(): OrderReportInfo {
  return {
    orderData: [],
    stats: {
      orders: 0,
      mealCount: 0,
      veggieMeals: 0,
      thankYouBags: 0,
      totalProteinWeight: 0,
      teriyakiCuppyCount: 0,
      extraRoastedVeggies: 0,
      proteinCubes: {},
      containers: {},
      proteins: {},
      veggieCarbs: {},
    },
    orderErrors: [],
    meals: [],
    usedBackstockIds: new Set<number>(),
    pullListDatas: [],
  };
}