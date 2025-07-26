interface AdjustOrderFormProps {
  toNextStep: () => void;
  toPrevStep: () => void;
}

export default function AdjustOrderForm({ toNextStep, toPrevStep }: AdjustOrderFormProps) {
  if (false) {
    toNextStep();
    toPrevStep();
  }

  return (
    <div>AdjustOrderForm Content</div>
  );
}