import { Menu, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop, IconCheck } from '@tabler/icons-react';

export function AppearanceControls() {
  const { setColorScheme, colorScheme } = useMantineColorScheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: IconSun },
    { value: 'dark', label: 'Dark', icon: IconMoon },
    { value: 'auto', label: 'System', icon: IconDeviceDesktop },
  ];

  return (
    <>
      {themeOptions.map((option) => (
        <Menu.Item
          key={option.value}
          leftSection={<option.icon size={16} />}
          rightSection={colorScheme === option.value ? <IconCheck size={16} /> : null}
          onClick={() => setColorScheme(option.value as 'light' | 'dark' | 'auto')}
        >
          {option.label}
        </Menu.Item>
      ))}
    </>
  );
}
