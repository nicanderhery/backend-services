import { getRegisteredRoutes } from '@/lib/route-registar';
import { Anchor, Box, Card, Center, Group, Stack, Title } from '@mantine/core';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

export default function HomePage() {
  const routes = getRegisteredRoutes();
  return (
    <Stack p="lg">
      <Group justify="end">
        <ColorSchemeToggle />
      </Group>

      <Center>
        <Title>Registered routes:</Title>
      </Center>
      <Center>
        <Card withBorder shadow="md">
          {routes.map((route) => (
            <Box key={route}>
              <Anchor href={route} target="_blank">
                {route}
              </Anchor>
            </Box>
          ))}
        </Card>
      </Center>
    </Stack>
  );
}
