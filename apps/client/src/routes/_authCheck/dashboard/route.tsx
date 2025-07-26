import {
  AppShell,
  Box,
  Burger,
  Container,
  Group,
  Image,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  createFileRoute,
  Link,
  Outlet,
} from "@tanstack/react-router";
import SkeletonDashboard from "../../../components/misc/SkeletonDashboard";
import ColorSchemeToggle from "../../../components/misc/ColorSchemeToggle";
import Navbar from "../../../components/navbar/Navbar";

export const Route = createFileRoute("/_authCheck/dashboard")({
  pendingComponent: SkeletonDashboard,
  component: Dashboard,
});

function Dashboard() {
  const [mobileOpened, { toggle: toggleMobile, close: closeOnMobile }] =
    useDisclosure(false);
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <AppShell
      header={{ height: 90 }}
      navbar={{
        width: 325,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header zIndex={250}>
        <Group h={"100%"} px={"sm"}>
          <Burger
            opened={mobileOpened}
            onClick={toggleMobile}
            hiddenFrom="sm"
            size="sm"
          />
          <Burger
            opened={desktopOpened}
            onClick={toggleDesktop}
            visibleFrom="sm"
            size="sm"
          />

          <UnstyledButton
            component={Link}
            to="/dashboard/home/"
          >
            <Group>
              <Title visibleFrom="sm">RPMP Dashboard</Title>
              <Title hiddenFrom="sm">RPMP</Title>
              <Image w={50} src={"/logo.png"}/>
            </Group>
          </UnstyledButton>

          <Box ms={"auto"}>
            <ColorSchemeToggle />
          </Box>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Navbar closeOnMobile={closeOnMobile} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container>
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
