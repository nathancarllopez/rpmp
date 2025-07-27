import { useMemo, useState } from "react";

import { IconEdit } from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Paper,
  Popover,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { backstockOptions } from "../../tanstack-query/queries/backstock";
import { proteinsOptions } from "../../tanstack-query/queries/proteins";
import { veggieCarbInfoOptions } from "../../tanstack-query/queries/veggieCarbInfo";
import { pullListOptions } from "../../tanstack-query/queries/pullList";
import { orderHeadersOptions } from "../../tanstack-query/queries/orderHeaders";
import { proteinsAndFlavorsOptions } from "../../tanstack-query/queries/proteinsWithFlavors";
import fetchReportUrl from "../../api/fetchReportUrl";
import { calculateOrderReportInfo } from "../../business-logic/calculateOrderReportInfo";
import type { AllBackstockRow, ContainerSize, Order, OrderReportInfo, ProteinRow } from "../../types/types";

type FlavorSelectData =
  | {
      value: string;
      label: string;
    }[]
  | null;

const displayHeaders: { orderKey: keyof Order; miw: number | undefined }[] = [
  { orderKey: "fullName", miw: 200 },
  { orderKey: "itemName", miw: 300 },
  { orderKey: "quantity", miw: 100 },
  { orderKey: "container", miw: 125 },
  { orderKey: "weight", miw: 125 },
  { orderKey: "protein", miw: 150 },
  { orderKey: "flavor", miw: 250 },
];

export interface OrderEditorProps {
  orderReportInfo: OrderReportInfo;
  setOrderReportInfo: React.Dispatch<React.SetStateAction<OrderReportInfo>>;
  setReportUrl: React.Dispatch<React.SetStateAction<string | undefined>>;
  toNextStep: () => void;
  toPrevStep: () => void;
}

export function OrderEditor({
  orderReportInfo,
  setOrderReportInfo,
  setReportUrl,
  toNextStep,
  toPrevStep,
}: OrderEditorProps) {
  const { data: allBackstock, error: backstockError } = useSuspenseQuery({
    ...backstockOptions(),
    select: (data) => data.filter((bRow) => bRow.available),
  });
  const { proteinBackstock, veggieCarbBackstock } = allBackstock.reduce(
    (result, row) => {
      if (row.isProtein) {
        result.proteinBackstock.push(row);
      } else {
        result.veggieCarbBackstock.push(row);
      }
      return result;
    },
    { proteinBackstock: [], veggieCarbBackstock: [] } as {
      proteinBackstock: AllBackstockRow[];
      veggieCarbBackstock: AllBackstockRow[];
    }
  );

  const { data: proteinInfo, error: proteinError } = useSuspenseQuery({
    ...proteinsOptions(),
    select: (data) =>
      data.reduce((info, pRow) => {
        info[pRow.name] = pRow;
        return info;
      }, {} as Record<string, ProteinRow>),
  });

  const { data: veggieCarbInfo, error: veggieCarbError } = useSuspenseQuery(
    veggieCarbInfoOptions()
  );

  const { data: pullList, error: pullListError } = useSuspenseQuery(
    pullListOptions()
  );

  const { data: columnsInfo, error: headerError } = useSuspenseQuery({
    ...orderHeadersOptions(),
    select: (data) =>
      displayHeaders.map(({ orderKey, miw }) => {
        const matchingDatum = data.find((row) => row.name === orderKey);
        if (!matchingDatum) throw new Error(`Found no match for ${orderKey}`);

        return {
          orderKey,
          label: matchingDatum.label,
          miw,
        };
      }),
  });

  const { data: proteinsWithFlavors, error: proteinFlavorError } =
    useSuspenseQuery({
      ...proteinsAndFlavorsOptions(),
      select: (data) =>
        data.map((pfRow) => ({
          ...pfRow,
          flavors: pfRow.flavors.map((fRow) => ({
            value: fRow.name,
            label: fRow.label,
          })),
        })),
    });

  const proteinFlavorDataLookup = useMemo(
    () =>
      proteinsWithFlavors.reduce((lookup, pfRow) => {
        lookup[pfRow.proteinName] = {
          label: pfRow.proteinLabel,
          flavors: pfRow.flavors,
        };
        return lookup;
      }, {} as { [protein: string]: { label: string; flavors: { value: string; label: string }[] } }),
    [proteinsWithFlavors]
  );

  const { orderData } = orderReportInfo;
  const initialOrderData: Order[] = useMemo(() => orderData, []);

  const [editingRow, setEditingRow] = useState<number>(-1);
  const [allFlavorSelectData, setAllFlavorSelectData] = useState<
    FlavorSelectData[]
  >(() =>
    orderData.map((row) => {
      const { protein } = row;
      if (!protein) return null;

      const flavors = proteinFlavorDataLookup[protein].flavors;

      return flavors.length > 0 ? flavors : null;
    })
  );
  const [weightPopoverFlags, setWeightPopoverFlags] = useState<boolean[]>(() =>
    orderData.map(() => false)
  );
  const [valueEditedFlags, setValueEditedFlags] = useState<Record<string, boolean>[]>(() =>
    orderData.map(() => ({
      quantity: false,
      container: false,
      weight: false,
      flavor: false,
      protein: false,
    }))
  );
  const orderDataIsEdited: boolean = useMemo(
    () =>
      valueEditedFlags.some((orderValues) =>
        Object.values(orderValues).some((val) => val)
      ),
    [valueEditedFlags]
  );

  const handleBackClick = () => {
    setOrderReportInfo((curr) => ({ ...curr, orderData: [] }));
    toPrevStep();
  };

  const errors = [backstockError, proteinError, pullListError, veggieCarbError, headerError, proteinFlavorError].filter((error) => !!error);
  if (errors.length > 0) {
    return (
      <Stack mt={"md"}>
        <Group grow>
          <Button onClick={handleBackClick} variant="default">
            Back to Upload
          </Button>
          <Button disabled variant="default">
            Reset Form
          </Button>
          <Button variant={"default"} disabled>
            Submit without Changes
          </Button>
        </Group>

        <Paper>
          <Text>Error occurred while fetching data</Text>
          {errors.map((error) => (
            <Text>{error.message}</Text>
          ))}
        </Paper>
      </Stack>
    );
  }

  const headers = (
    <Table.Tr>
      <Table.Th style={{ whiteSpace: "nowrap" }} ta={"center"}>
        Row
      </Table.Th>
      {columnsInfo.map((item) => (
        <Table.Th
          key={item.orderKey}
          style={{ whiteSpace: "nowrap" }}
          ta={"center"}
          miw={item.miw}
        >
          {item.label}
        </Table.Th>
      ))}
      <Table.Th style={{ whiteSpace: "nowrap" }} ta={"center"}>
        Edit
      </Table.Th>
    </Table.Tr>
  );

  const rows = orderData.map((order, index) => (
    <Table.Tr key={index}>
      <Table.Td ta={"center"}>{index + 1}</Table.Td>
      {columnsInfo.map(({ orderKey }) => {
        const originalValue = initialOrderData[index][orderKey];
        const currValue = order[orderKey];
        const valueHasChanged = originalValue !== currValue;

        const td = (() => {
          if (index !== editingRow) {
            const hasProtein = !!order["protein"];

            switch (orderKey) {
              case "protein": {
                if (hasProtein) {
                  return <Text>{order["proteinLabel"]}</Text>;
                }
                return <Text>-</Text>;
              }

              case "flavor": {
                if (hasProtein) {
                  return <Text>{order["flavorLabel"]}</Text>;
                }
                return <Text>-</Text>;
              }

              default: {
                return <Text>{currValue}</Text>;
              }
            }
          }

          switch (orderKey) {
            case "quantity": {
              return (
                <NumberInput
                  placeholder="Quantity"
                  required={!!originalValue}
                  allowDecimal={false}
                  value={currValue}
                  min={1}
                  onChange={(value) => {
                    const newQuantity = Number(value);

                    setValueEditedFlags((curr) => {
                      const copy = [...curr];
                      copy[index].quantity = originalValue === newQuantity;

                      return copy;
                    });

                    setOrderReportInfo((curr) => {
                      const { orderData } = curr;

                      const orderCopy = [...orderData];
                      orderCopy[index] = {
                        ...orderData[index],
                        quantity: newQuantity,
                      };

                      const container = order.container;
                      if (container !== "bulk") {
                        const containerWeight = Number(
                          container.replace(/[^0-9.]/g, "")
                        );
                        const weight =
                          Math.round(containerWeight * newQuantity * 100) / 100;
                        orderCopy[index] = { ...orderCopy[index], weight };
                      }

                      return { ...curr, orderData: orderCopy };
                    });
                  }}
                />
              );
            }

            case "container": {
              return (
                <Select
                  data={["2.5oz", "4oz", "6oz", "8oz", "10oz", "bulk"]}
                  required={!!originalValue}
                  value={order.container}
                  allowDeselect={false}
                  onChange={(value) => {
                    if (value === null) {
                      console.warn(order);
                      throw new Error("Container should not be null");
                    }

                    const newContainer = value as ContainerSize;

                    setValueEditedFlags((curr) => {
                      const copy = [...curr];
                      copy[index].container = originalValue === newContainer;

                      return copy;
                    });

                    setOrderReportInfo((curr) => {
                      const { orderData } = curr;

                      const orderCopy = [...orderData];
                      orderCopy[index] = {
                        ...orderData[index],
                        container: newContainer,
                      };

                      if (newContainer === "bulk") {
                        orderCopy[index] = { ...orderCopy[index], weight: 0 };
                      } else {
                        const quantity = order.quantity;
                        const containerWeight = Number(
                          newContainer.replace(/[^0-9.]/g, "")
                        );
                        const weight =
                          Math.round(containerWeight * quantity * 100) / 100;
                        orderCopy[index] = { ...orderCopy[index], weight };
                      }

                      return { ...curr, orderData: orderCopy };
                    });

                    setWeightPopoverFlags((curr) => {
                      const copy = [...curr];
                      copy[index] = newContainer === "bulk";

                      return copy;
                    });
                  }}
                />
              );
            }

            case "weight": {
              return (
                <Popover opened={weightPopoverFlags[index]}>
                  <Popover.Target>
                    <NumberInput
                      placeholder="Weight (oz)"
                      required={!!originalValue}
                      suffix=" oz"
                      hideControls
                      readOnly={order.container !== "bulk"}
                      value={Number(currValue) > 0 ? currValue : ""}
                      onChange={(value) => {
                        const newWeight = Number(value);

                        setValueEditedFlags((curr) => {
                          const copy = [...curr];
                          copy[index].weight = originalValue === newWeight;

                          return copy;
                        });

                        setOrderReportInfo((curr) => {
                          const { orderData } = curr;

                          const orderCopy = [...orderData];
                          orderCopy[index] = {
                            ...orderData[index],
                            weight: newWeight,
                          };

                          return { ...curr, orderData: orderCopy };
                        });

                        if (newWeight > 0) {
                          setWeightPopoverFlags((curr) => {
                            const copy = [...curr];
                            copy[index] = false;

                            return copy;
                          });
                        }
                      }}
                    />
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text>Weight must be set manually for bulk containers</Text>
                  </Popover.Dropdown>
                </Popover>
              );
            }

            case "protein": {
              return (
                <Select
                  placeholder="Protein"
                  data={proteinsWithFlavors.map((row) => ({
                    value: row.proteinName,
                    label: row.proteinLabel,
                  }))}
                  allowDeselect={false}
                  searchable
                  required
                  value={order.protein}
                  onChange={(value) => {
                    if (value === null) {
                      console.warn(order);
                      throw new Error("Protein should not be null");
                    }

                    const newProtein = value;

                    setValueEditedFlags((curr) => {
                      const copy = [...curr];
                      copy[index].protein = originalValue === newProtein;

                      return copy;
                    });

                    const proteinMatch = proteinFlavorDataLookup[newProtein];
                    if (!proteinMatch) {
                      console.warn(order);
                      console.warn("newProtein:", newProtein);
                      throw new Error("Could not find matching protein");
                    }

                    const { label, flavors } = proteinMatch;

                    setOrderReportInfo((curr) => {
                      const { orderData } = curr;

                      const orderCopy = [...orderData];
                      orderCopy[index] = {
                        ...orderData[index],
                        protein: newProtein,
                        proteinLabel: label,
                      };

                      return { ...curr, orderData: orderCopy };
                    });

                    setAllFlavorSelectData((curr) => {
                      const copy = [...curr];
                      copy[index] = flavors.length > 0 ? flavors : null;

                      return copy;
                    });
                  }}
                />
              );
            }

            case "flavor": {
              const flavorSelectData = allFlavorSelectData[index];
              const selectDisabled = flavorSelectData === null;

              return (
                <Tooltip
                  disabled={!selectDisabled}
                  label="This protein has no flavors"
                >
                  <Select
                    allowDeselect={false}
                    placeholder={!selectDisabled ? "Flavor" : "n/a"}
                    data={flavorSelectData ?? [{ value: "n/a", label: "n/a" }]}
                    disabled={selectDisabled}
                    required={!selectDisabled}
                    searchable
                    value={!selectDisabled ? order.flavor : "n/a"}
                    onChange={(value) => {
                      if (flavorSelectData === null) return;

                      if (value === null) {
                        console.warn(order);
                        throw new Error("Flavor should not be null");
                      }

                      const newFlavor = value;

                      setValueEditedFlags((curr) => {
                        const copy = [...curr];
                        copy[index].flavor = originalValue === newFlavor;

                        return copy;
                      });

                      const flavorMatch = flavorSelectData.find(
                        (row) => row.value === newFlavor
                      );
                      if (!flavorMatch) {
                        console.warn(order);
                        console.warn("newFlavor:", newFlavor);
                        throw new Error("Could not find flavor match");
                      }

                      const { value: flavor, label: flavorLabel } = flavorMatch;

                      setOrderReportInfo((curr) => {
                        const { orderData } = curr;

                        const orderCopy = [...orderData];
                        orderCopy[index] = {
                          ...orderData[index],
                          flavor,
                          flavorLabel,
                        };

                        return { ...curr, orderData: orderCopy };
                      });
                    }}
                  />
                </Tooltip>
              );
            }

            default: {
              return <Text>{originalValue}</Text>;
            }
          }
        })();

        return (
          <Table.Td
            key={`${orderKey}-${index}`}
            bg={valueHasChanged ? "blue" : undefined}
            ta={orderKey !== "itemName" ? "center" : undefined}
          >
            {td}
          </Table.Td>
        );
      })}
      <Table.Td ta={"center"}>
        <ActionIcon
          variant={index === editingRow ? "filled" : "default"}
          onClick={() =>
            setEditingRow((curr) => {
              if (curr === index) return -1;
              return index;
            })
          }
        >
          <IconEdit />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  const handleResetClick = () => {
    setOrderReportInfo((curr) => ({ ...curr, orderData: initialOrderData }));
    setValueEditedFlags(() =>
      initialOrderData.map(() => ({
        quantity: false,
        container: false,
        weight: false,
        flavor: false,
        protein: false,
      }))
    );
  };

  const handleSubmitClick = async () => {
    const updatedInfo = calculateOrderReportInfo(
      orderReportInfo,
      proteinBackstock,
      veggieCarbBackstock,
      proteinInfo,
      veggieCarbInfo,
      pullList
    );
    setOrderReportInfo(updatedInfo);

    const url = await fetchReportUrl(updatedInfo);
    setReportUrl(url);

    toNextStep();
  }

  return (
    <Stack mt={"md"}>
      <Group grow>
        <Button onClick={handleBackClick} variant="default">
          Back to Upload
        </Button>
        <Tooltip disabled={orderDataIsEdited} label="No changes detected">
          <Button
            disabled={!orderDataIsEdited}
            onClick={handleResetClick}
            variant="default"
          >
            Reset Data
          </Button>
        </Tooltip>
        <Button variant={"default"} onClick={handleSubmitClick}>
          {orderDataIsEdited ? "Submit Changes" : "Submit without Changes"}
        </Button>
      </Group>

      <ScrollArea h={600} overscrollBehavior="contain">
        <Table
          stickyHeader
          highlightOnHover
          horizontalSpacing={"sm"}
          verticalSpacing={"sm"}
        >
          <Table.Thead>{headers}</Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </Stack>
  );
}
