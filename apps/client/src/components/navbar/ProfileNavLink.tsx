import { Avatar, NavLink, Skeleton, Text } from "@mantine/core";
import NavLinkLabel from "./NavLinkLabel";
import { useSuspenseQuery } from "@tanstack/react-query";
import NavLinkChevron from "./NavLinkChevron";
import { Link } from "@tanstack/react-router";
import { profilePicOptions } from "../../tanstack-query/queries/profilePic";
import type { ProfileRow } from "../../types/types";

interface ProfileNavLinkProps {
  profile: ProfileRow;
  skeletonVisible: boolean;
  closeOnMobile: () => void;
}

export default function ProfileNavLink({
  profile,
  skeletonVisible,
  closeOnMobile,
}: ProfileNavLinkProps) {
  const { data: profilePicUrl, error: profilePicError } = useSuspenseQuery(
    profilePicOptions(profile.userId)
  );

  const Label = () => (
    <NavLinkLabel
      label={
        <Skeleton visible={skeletonVisible}>
          <Text size="md">{profile.fullName}</Text>
          <Text c="dimmed" size="xs">
            {profile.email}
          </Text>
        </Skeleton>
      }
    />
  );

  const LeftSection = () => (
    <Skeleton visible={!!profilePicError}>
      {profilePicUrl ? (
        <Avatar src={profilePicUrl} alt={profile.fullName} />
      ) : (
        <Avatar name={profile.fullName} color="initials" />
      )}
    </Skeleton>
  );

  return (
    <NavLink
      label={<Label />}
      leftSection={<LeftSection />}
      rightSection={<NavLinkChevron pointedDown={false} />}
      component={Link}
      to="/dashboard/home/"
      onClick={closeOnMobile}
    />
  );
}
