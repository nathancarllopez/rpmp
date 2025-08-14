import { ActionIcon, Collapse, Group, Paper, Stack, Title } from "@mantine/core";
import type { ProteinRow } from "../../types/types";
import { useDisclosure } from "@mantine/hooks";
import ProteinInfoTable from "./ProteinInfoTable";
import ProteinUpdateForm from "./ProteinUpdateForm";
import { IconEdit, IconX } from "@tabler/icons-react";

interface ProteinDisplayProps {
  protein: ProteinRow;
  flavorLabels: string[]
}

export default function ProteinDisplay({ protein, flavorLabels }: ProteinDisplayProps) {
  const [isEditing, { toggle }] = useDisclosure(false);

  return (
    <Paper>
      <Group>
        <Title order={2} me={'auto'}>{protein.label}</Title>
        <ActionIcon variant="default" size={"lg"} onClick={toggle}>
          {isEditing ? <IconX /> : <IconEdit /> }
        </ActionIcon>
      </Group>
      
      <Stack>
        <ProteinInfoTable protein={protein} flavorLabels={flavorLabels}/>

        <Collapse in={isEditing}>
          {isEditing && <ProteinUpdateForm protein={protein}/>}
        </Collapse>
      </Stack>
    </Paper>
  );
}