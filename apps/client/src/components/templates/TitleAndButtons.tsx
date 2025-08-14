import { Button, Group, Title } from "@mantine/core";

interface TitleAndButtonsProps {
  title: string;
  changesMade: boolean;
  onSave: () => void;
  onReset: () => void;
  onAdd: () => void;
}

export default function TitleAndButtons({
  title,
  changesMade,
  onSave,
  onReset,
  onAdd,
}: TitleAndButtonsProps) {
  return (
    <Group>
      <Title me={'auto'}>{title}</Title>
      <Button disabled={!changesMade} onClick={onSave}>Save</Button>
      <Button disabled={!changesMade} onClick={onReset}>Reset</Button>
      <Button onClick={onAdd}>Add</Button>
    </Group>
  );
}
