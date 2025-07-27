import { useForm } from "@mantine/form";
import { Fragment } from "react/jsx-runtime";
import { IconSettings } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Divider,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import { settingsOptions } from "../../../tanstack-query/queries/settings";
import LoadingScreen from "../../../components/misc/LoadingScreen";
import { useUpdateSettingsMutation } from "../../../tanstack-query/mutations/updateSettings";
import { navbarInfo } from "../../../util/navbarInfo";
import FormWithDisable from "../../../components/misc/FormWithDisable";
import { camelToSnake } from "../../../util/key-converters";
import type { UpdateSettingsInfo } from "../../../types/types";

export const Route = createFileRoute('/_authCheck/dashboard/settings')({
  loader: ({ context: { userId, queryClient } }) => {
    if (userId === null) {
      throw new Error("User is authenticated but does not have a userId");
    }

    queryClient.ensureQueryData(settingsOptions(userId));
  },
  pendingComponent: LoadingScreen,
  component: Settings,
})

function Settings() {
  const { userId } = Route.useRouteContext();

  const updateSettingsMutation = useUpdateSettingsMutation(userId);
  const { data, error } = useSuspenseQuery(settingsOptions(userId));

  const form = useForm({
    mode: "uncontrolled",
    initialValues: data,
  });

  if (error) {
    return (
      <Stack>
        <Title>Settings</Title>
        <Paper>
          <Text>Error fetching settings information:</Text>
          <Text>{error.message}</Text>
        </Paper>
      </Stack>
    );
  }

  const dashboardRouteInputs: Record<string, React.ReactNode> = {
    orders: (
      <Stack>
        <Switch
          label={"Skip editing step of order upload"}
          key={form.key("orders.skipEdits")}
          {...form.getInputProps("orders.skipEdits")}
        />
      </Stack>
    ),
  };

  const sectionTitleOrder = 4;
  const dashboardRouteSections = navbarInfo.map((info, index) => {
    const inputs = dashboardRouteInputs[info.id];

    return (
      <Fragment key={info.id}>
        <Group mb={"xs"}>
          {info.icon}
          <Title order={sectionTitleOrder}>{info.label}</Title>
        </Group>

        {inputs}
        {index !== navbarInfo.length - 1 && <Divider my={"sm"} />}
      </Fragment>
    );
  });

  const handleSubmit = async (values: typeof form.values) => {
    const updateInfo = camelToSnake<UpdateSettingsInfo>(values);

    updateSettingsMutation.mutate(updateInfo, {
      onSuccess: () => {
        notifications.show({
          withCloseButton: true,
          color: "green",
          title: "Update Successful",
          message: "Your settings have been updated",
        });
      },
      onError: (error) => {
        console.warn("Error updating settings: ", error.message);
        notifications.show({
          withCloseButton: true,
          color: "red",
          title: "Update Failed",
          message: error.message,
        });
      },
    });
  };

  return (
    <Stack>
      <Title>Settings</Title>
      <FormWithDisable
        submitButtonLabels={{
          label: "Update",
          disabledLabel: "Updating...",
        }}
        submitButtonStyle={{ mt: "md", fullWidth: true }}
        onSubmit={form.onSubmit(handleSubmit)}
      >
        <Group mb={"xs"}>
          <IconSettings />
          <Title order={sectionTitleOrder}>General</Title>
        </Group>
        <Divider my={"md"} />
        {dashboardRouteSections}
      </FormWithDisable>

      <Text>Backstock</Text>
      <ul>
        <li>Toggle navigation warning after making edits</li>
        <li>Colors for each protein</li>
      </ul>
    </Stack>
  );
}
