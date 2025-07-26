import {
  ActionIcon,
  Button,
  Center,
  Checkbox,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import classes from "./pull-list.module.css";
import { IconGripVertical, IconTrash } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useMemo, useState } from "react";
import { notifications } from "@mantine/notifications";
import { pullListOptions } from "../../../../tanstack-query/queries/pullList";
import LoadingScreen from "../../../../components/misc/LoadingScreen";
import type { PullListRow } from "@repo/global-types/types";
import { useUpdatePullListMutation } from "../../../../tanstack-query/mutations/updatePullList";
import NavigationBlockAlert from "../../../../components/misc/NavigationBlockAlert";

export const Route = createFileRoute(
  "/_authCheck/dashboard/_templates/pull-list"
)({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(pullListOptions());
  },
  pendingComponent: LoadingScreen,
  component: PullList,
});

function PullList() {
  const { data: pullList, error: pullListError } = useSuspenseQuery(
    pullListOptions()
  );

  const [idsToDelete, setIdsToDelete] = useState<Set<number>>(new Set());

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      rows: pullList,
    },
  });

  const changesMade = useMemo(() => {
    if (idsToDelete.size !== 0) return true;

    const currentFormValues = form.getValues().rows;
    const keysToCheck = [
      "id",
      "freezerSunday",
      "freezerMonday",
    ] as (keyof PullListRow)[];

    for (let i = 0; i < pullList.length; i++) {
      const plRow = pullList[i];
      const cfvRow = currentFormValues[i];

      for (const key of keysToCheck) {
        if (plRow[key] !== cfvRow[key]) {
          return true;
        }
      }
    }

    return false;
  }, [pullList, idsToDelete, form]);

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => changesMade,
    withResolver: true,
  })

  const updatePullListMutation = useUpdatePullListMutation();
  const handleSaveClick = () => {
    updatePullListMutation.mutate({
      idsToDelete,
      updates: form.getValues().rows,
    }, {
      onSuccess: () => {
        notifications.show({
          withCloseButton: true,
          color: "green",
          title: "Pull List Updated",
          message: "The changes to the pull list have been submitted",
        });
      },
      onError: (error) => {
        console.warn("Error adding to backstock: ", error.message);
        notifications.show({
          withCloseButton: true,
          color: "red",
          title: "Updating Pull List Failed",
          message: error.message,
        });
      },
    });
  };

  const handleResetClick = () => {
    setIdsToDelete(new Set());
    form.reset();
  };

  const handleAddClick = () => {
    notifications.show({
      withCloseButton: true,
      color: "blue",
      title: "Under construction",
      message: "This hasn't been completed yet",
    })
  }

  const TitleAndButtons = () => (
    <Group>
      <Title me={"auto"}>Pull List</Title>
      <Button disabled={!changesMade} onClick={handleSaveClick}>
        Save
      </Button>
      <Button disabled={!changesMade} onClick={handleResetClick}>
        Reset
      </Button>
      <Button onClick={handleAddClick}>Add</Button>
    </Group>
  );

  const errors = [pullListError].filter((err) => !!err);
  if (errors.length) {
    return (
      <Stack>
        <TitleAndButtons />

        <Paper>
          <Text>Error:</Text>
          {errors.map((err, index) => (
            <Text key={index}>{err.message}</Text>
          ))}
        </Paper>
      </Stack>
    );
  }

  const handleDeleteClick = (index: number, id: number) => {
    form.removeListItem("rows", index);
    setIdsToDelete((curr) => {
      const copy = new Set(curr);
      copy.add(id);
      return copy;
    });
  };

  const rows = form.getValues().rows.map((row, index) => (
    <Draggable key={row.id} index={index} draggableId={row.id.toString()}>
      {(provided) => (
        <Table.Tr
          className={classes.row}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <Table.Td>
            <div className={classes.dragHandle} {...provided.dragHandleProps}>
              <IconGripVertical size={18} stroke={1.5} />
            </div>
          </Table.Td>
          <Table.Td>{row.label}</Table.Td>
          <Table.Td>
            <Center>
              <Checkbox
                key={form.key(`rows.${index}.freezerSunday`)}
                {...form.getInputProps(`rows.${index}.freezerSunday`, {
                  type: "checkbox",
                })}
              />
            </Center>
          </Table.Td>
          <Table.Td>
            <Center>
              <Checkbox
                key={form.key(`rows.${index}.freezerMonday`)}
                {...form.getInputProps(`rows.${index}.freezerMonday`, {
                  type: "checkbox",
                })}
              />
            </Center>
          </Table.Td>
          <Table.Td>
            <Center>
              <ActionIcon
                variant="default"
                onClick={() => handleDeleteClick(index, row.id)}
              >
                <IconTrash color="red" />
              </ActionIcon>
            </Center>
          </Table.Td>
        </Table.Tr>
      )}
    </Draggable>
  ));

  return (
    <Stack>
      <NavigationBlockAlert
        opened={status === 'blocked'}
        proceed={proceed}
        reset={reset}
        text={{ // To do: make these more specific
          title: "Wait stop!",
          message: "If you leave now all will be lost!",
        }}
      />

      <TitleAndButtons />

      <DragDropContext
        onDragEnd={({ destination, source }) =>
          destination?.index !== undefined &&
          form.reorderListItem("rows", {
            from: source.index,
            to: destination.index,
          })
        }
      >
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th />
              <Table.Th>Name</Table.Th>
              <Table.Th ta={"center"}>Freezer Sunday</Table.Th>
              <Table.Th ta={"center"}>Freezer Monday</Table.Th>
              <Table.Th ta={"center"}>Delete</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Droppable droppableId="pull-list" direction="vertical">
            {(provided) => (
              <Table.Tbody {...provided.droppableProps} ref={provided.innerRef}>
                {rows}
                {provided.placeholder}
              </Table.Tbody>
            )}
          </Droppable>
        </Table>
      </DragDropContext>
    </Stack>
  );
}
