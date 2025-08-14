import { useForm } from "@mantine/form";
import type { ProteinRow } from "../../types/types";
import { Stack } from "@mantine/core";

interface ProteinUpdateFormProps {
  protein: ProteinRow;
}

export default function ProteinUpdateForm({ protein }: ProteinUpdateFormProps) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: protein,
  });

  console.log(form);

  return (
    <Stack>
      <div>helllo</div>
    </Stack>
  );
}