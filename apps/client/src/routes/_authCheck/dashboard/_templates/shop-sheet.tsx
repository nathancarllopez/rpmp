import { Stack } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router'
import TitleAndButtons from '../../../../components/templates/TitleAndButtons';

export const Route = createFileRoute(
  '/_authCheck/dashboard/_templates/shop-sheet',
)({
  component: ShopSheet,
})

function ShopSheet() {
  

  return (
    <Stack>
      <TitleAndButtons
        title='Shop Sheet'
        changesMade={false}
        onSave={() => {}}
        onReset={() => {}}
        onAdd={() => {}}
      />

    </Stack>
  );
}
