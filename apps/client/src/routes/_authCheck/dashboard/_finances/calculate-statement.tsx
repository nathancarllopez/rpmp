import { Stack, Stepper, Title } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import AdjustOrderForm from '../../../../components/finances/AdjustOrderForm';

export const Route = createFileRoute(
  '/_authCheck/dashboard/_finances/calculate-statement',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const [active, setActive] = useState(0);

  const stepProps: Record<string, Record<string, string>> = {
    adjustOrder: { label: "Step 1", description: "Adjust order data" },
    shop: { label: "Step 2", description: "Update shop info" },
    costs: { label: "Step 3", description: "Calculate order costs" },
    final: { label: "Step 4", description: "Review final numbers" }
  };
  const numSteps = Object.keys(stepProps).length;

  const toNextStep = () =>
    setActive((curr) => Math.min(numSteps - 1, curr + 1));
  const toPrevStep = () => setActive((curr) => Math.max(0, curr - 1));

  return (
    <Stack>
      <Title>Calculate Statement</Title>

      <Stepper active={active} allowNextStepsSelect={false}>
        <Stepper.Step {...stepProps.adjustOrder}>
          <AdjustOrderForm toNextStep={toNextStep} toPrevStep={toPrevStep}/>
        </Stepper.Step>
        <Stepper.Step {...stepProps.shop}></Stepper.Step>
        <Stepper.Step {...stepProps.costs}></Stepper.Step>
        <Stepper.Step {...stepProps.final}></Stepper.Step>
      </Stepper>
    </Stack>
  );
}
