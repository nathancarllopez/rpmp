import { Button, Group, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import LoadingScreen from "../../../../components/misc/LoadingScreen";
import { proteinsOptions } from "../../../../tanstack-query/queries/proteins";
import { useSuspenseQuery } from "@tanstack/react-query";
import ProteinDisplay from "../../../../components/menu/ProteinDisplay";
import { proteinsAndFlavorsOptions } from "../../../../tanstack-query/queries/proteinsWithFlavors";

export const Route = createFileRoute("/_authCheck/dashboard/_menu/proteins")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(proteinsOptions());
  },
  pendingComponent: LoadingScreen,
  component: Proteins,
});

function Proteins() {
  const { data: proteinData, error: proteinError } =
    useSuspenseQuery(proteinsOptions());

  const { data: proteinWithFlavorsData, error: proteinWithFlavorsError } =
    useSuspenseQuery(proteinsAndFlavorsOptions());

  const displayInfo = proteinData.map((pRow) => {
    const withFlavors = proteinWithFlavorsData.find(
      (pfRow) => pfRow.proteinName === pRow.name
    );

    const flavorLabels =
      withFlavors !== undefined
        ? withFlavors.flavors.map(({ label }) => label)
        : [];

    return { ...pRow, flavorLabels };
  });

  const errors = [proteinError, proteinWithFlavorsError].filter(
    (error) => !!error
  );
  if (errors.length > 0) {
    return (
      <Stack>
        <Group>
          <Title me={"auto"}>Proteins</Title>
          <Button disabled>Add Protein</Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack>
      <Group>
        <Title me={"auto"}>Proteins</Title>
        <Button>Add Protein</Button>
      </Group>

      {displayInfo.map((protein) => (
        <ProteinDisplay
          key={protein.id}
          protein={protein}
          flavorLabels={protein.flavorLabels}
        />
      ))}
    </Stack>
  );
}
