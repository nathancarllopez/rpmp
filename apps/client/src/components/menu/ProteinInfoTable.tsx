import { Table } from "@mantine/core";
import type { ProteinRow } from "../../types/types";

interface ProteinInfoTableProps {
  protein: ProteinRow;
  flavorLabels: string[];
}

export default function ProteinInfoTable({ protein, flavorLabels }: ProteinInfoTableProps) {
  const flavorsData = 
    flavorLabels.length > 0
      ? flavorLabels.join(", ")
      : "n/a"

  const rows = [
    { header: "Flavors", data: flavorsData },
    { header: "Lbs Per", data: `${protein.lbsPer} lbs` },
    { header: "Shrink", data: `${protein.shrink}%` },
  ];

  return (
    <Table variant="vertical">
      <Table.Tbody>
        {rows.map(({ header, data }) => (
          <Table.Tr key={header}>
            <Table.Th>{header}</Table.Th>
            <Table.Td>{data}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}