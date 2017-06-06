import { Box, Text } from "@booga/vDsl";

export function AsHtmlTag() {
  return <Box as="div">content</Box>;
}

export function AsAnotherHtmlTag() {
  return <Text as="span">label</Text>;
}

export function AsComponentIsOk() {
  return <Box as={Text}>content</Box>;
}
