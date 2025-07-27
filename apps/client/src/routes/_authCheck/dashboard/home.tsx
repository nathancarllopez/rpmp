import { Stack, Text, Title } from '@mantine/core';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'
import { profileByIdOptions } from '../../../tanstack-query/queries/profileById';
import LoadingScreen from '../../../components/misc/LoadingScreen';
import ViewEditProfile from '../../../components/home/ViewEditProfile';
import { allProfilePicsOptions } from '../../../tanstack-query/queries/allProfilePics';

export const Route = createFileRoute('/_authCheck/dashboard/home')({
  loader: ({ context }) => {
    const { userId, queryClient } = context;
    
    queryClient.ensureQueryData(profileByIdOptions(userId));
  },
  pendingComponent: LoadingScreen,
  component: Home,
})

function Home() {
  const { userId } = Route.useRouteContext();
  const { data: profile, error: profileError } = useSuspenseQuery(profileByIdOptions(userId))
  const { data: profilePicUrl, error: profilePicError } = useSuspenseQuery({
    ...allProfilePicsOptions(),
    select: (data) => {
      const picUrl = data[userId];
      if (!picUrl) {
        throw new Error(`Could not find profile picture url`)
      };
      return picUrl;
    }
  })

  const errors = [profileError, profilePicError].filter((error) => !!error);
  if (errors.length > 0) {
    return (
      <Stack>
        <Text>Errors fetching profile info</Text>
        {errors.map((error, index) => (
          <Text key={index}>{error.message}</Text>
        ))}
      </Stack>
    );
  }

  const showAdminControls = ["admin", "owner"].includes(profile.role);

  return (
    <Stack>
      <Title>Home</Title>

      <ViewEditProfile
        profileToDisplay={profile}
        profilePicToDisplay={profilePicUrl}
        showAdminControls={showAdminControls}
        userId={userId}
      />

      <Title>Timecards</Title>
    </Stack>
  );
}
