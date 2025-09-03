import { SegmentedControl, useMantineColorScheme, Group, Center, Box } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';

export function AppearanceControls() {
  const { setColorScheme, colorScheme } = useMantineColorScheme();

  return (
    <Group justify="center" my="xl">
      <SegmentedControl
        value={colorScheme}
        onChange={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
        data={[
          {
            value: 'light',
            label: (
              <Center>
                <IconSun size="1rem" stroke={1.5} />
                <Box ml={10}>Light</Box>
              </Center>
            ),
          },
          {
            value: 'dark',
            label: (
              <Center>
                <IconMoon size="1rem" stroke={1.5} />
                <Box ml={10}>Dark</Box>
              </Center>
            ),
          },
          {
            value: 'auto',
            label: (
              <Center>
                <IconDeviceDesktop size="1rem" stroke={1.5} />
                <Box ml={10}>System</Box>
              </Center>
            ),
          },
        ]}
      />
    </Group>
  );
}
