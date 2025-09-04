import { SegmentedControl, useMantineColorScheme, Group, Center, Box } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';

export function AppearanceControls() {
  const { setColorScheme, colorScheme } = useMantineColorScheme();

  return (
    <Group justify="center" grow>
      <SegmentedControl
        fullWidth
        value={colorScheme}
        onChange={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
        size="xs"
        transitionDuration={300}
        transitionTimingFunction="linear"
        data={[
          {
            value: 'light',
            label: (
              <Center style={{ gap: 10 }}>
                <IconSun size="0.9rem" stroke={1.5} />
                <span>Light</span>
              </Center>
            ),
          },
          {
            value: 'dark',
            label: (
              <Center style={{ gap: 10 }}>
                <IconMoon size="0.9rem" stroke={1.5} />
                <span>Dark</span>
              </Center>
            ),
          },
          {
            value: 'auto',
            label: (
              <Center style={{ gap: 10 }}>
                <IconDeviceDesktop size="0.9rem" stroke={1.5} />
                <span>System</span>
              </Center>
            ),
          },
        ]}
      />
    </Group>
  );
}
