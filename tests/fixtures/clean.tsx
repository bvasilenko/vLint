// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { Box, Stack } from "@booga/vDsl";

export function Card() {
  return (
    <Box p={4} m={2}>
      <Stack gap={6}>
        <Box w={12} h={12} />
      </Stack>
    </Box>
  );
}
