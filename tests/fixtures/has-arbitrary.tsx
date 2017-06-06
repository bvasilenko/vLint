import { Box } from "@booga/vDsl";

export function ArbitraryClass() {
  return <Box className="bg-[#fff] p-4">content</Box>;
}

export function MultipleArbitrary() {
  return <div className="w-[200px] h-[100px]">sized</div>;
}
