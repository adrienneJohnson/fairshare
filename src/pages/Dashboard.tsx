import React, { useMemo } from "react";
import { VictoryPie } from "victory";
import { Link, useParams } from "react-router-dom";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Text,
  Heading,
  Stack,
  Button,
  Input,
  StackDivider,
  Table,
  Thead,
  Tr,
  Tbody,
  Td,
  Modal,
  useDisclosure,
  ModalContent,
  Spinner,
  Alert,
  AlertTitle,
  AlertIcon,
  Select,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  Flex,
  Box,
  Spacer,
} from "@chakra-ui/react";
import { DataMap, Grant, Shareholder, Share } from "../types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import produce from "immer";
import { ChartViewModes } from "../consts";
import { calculateChartData, calculateShareTotals } from "../utils";

export function Dashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const [newShareholder, setNewShareholder] = React.useState<
    Omit<Shareholder, "id" | "grants">
  >({ name: "", group: "employee" });
  const { mode = ChartViewModes.ByGroup } = useParams();
  const shareholderMutation = useMutation<
    Shareholder,
    unknown,
    Omit<Shareholder, "id" | "grants">
  >(
    (shareholder) =>
      fetch("/shareholder/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareholder),
      }).then((res) => res.json()),
    {
      onSuccess: (data) => {
        queryClient.setQueryData<{ [id: number]: Shareholder } | undefined>(
          "shareholders",
          (s) => {
            if (s) {
              return produce(s, (draft) => {
                draft[data.id] = data;
              });
            }
          }
        );
      },
    }
  );

  // TODO: using this dictionary thing a lot... hmmm
  const grant = useQuery<DataMap<Grant>, string>("grants", () =>
    fetch("/grants").then((e) => e.json())
  );

  const shareholder = useQuery<DataMap<Shareholder>>("shareholders", () =>
    fetch("/shareholders").then((e) => e.json())
  );

  const shares = useQuery<{ [dataID: number]: Share }>("shares", () =>
    fetch("/shares").then((e) => e.json())
  );

  const chartData = useMemo(() => {
    if (!shareholder.data || !grant.data || !shares.data) {
      return {};
    }

    return calculateChartData(shareholder.data, grant.data, shares.data);
  }, [grant.data, shareholder.data, shares.data]);

  const shareTotals = useMemo<
    Record<string, { numShares: number; valueShares: number }>
  >(() => {
    const chartDataByShareType = chartData[ChartViewModes.ByShareType];

    if (!shares.data || !chartDataByShareType) {
      return {};
    }

    return calculateShareTotals(shares.data, chartDataByShareType);
  }, [shares.data, chartData]);

  if (grant.status === "error") {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error: {grant.error}</AlertTitle>
      </Alert>
    );
  }

  if (
    grant.status !== "success" ||
    shareholder.status !== "success" ||
    shares.status !== "success"
  ) {
    return <Spinner />;
  }
  if (!grant.data || !shareholder.data || !shares.data) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Failed to get any data</AlertTitle>
      </Alert>
    );
  }

  async function submitNewShareholder(e: React.FormEvent) {
    e.preventDefault();
    await shareholderMutation.mutateAsync(newShareholder);
    onClose();
  }

  return (
    <Stack>
      <Stack direction="row" justify="space-between" alignItems="baseline">
        <Heading
          size="md"
          bgGradient="linear(to-br, teal.400, teal.100)"
          bgClip="text"
        >
          Fair Share
        </Heading>
        <Stack direction="row">
          <Button
            colorScheme="teal"
            as={Link}
            to="/dashboard/investor"
            variant="ghost"
            isActive={mode === "investor"}
          >
            By Investor
          </Button>
          <Button
            colorScheme="teal"
            as={Link}
            to="/dashboard/group"
            variant="ghost"
            isActive={mode === "group"}
          >
            By Group
          </Button>
          <Button
            colorScheme="teal"
            as={Link}
            to="/dashboard/class"
            variant="ghost"
            isActive={mode === "class"}
          >
            By Share Type
          </Button>
        </Stack>
      </Stack>
      <VictoryPie colorScale="blue" data={chartData[mode]} />
      <Stack divider={<StackDivider />}>
        <Heading>Market Value</Heading>
        <Box>
          <Table>
            <Thead>
              <Tr>
                <Td>Share Type</Td>
                <Td>Number of Shares</Td>
                <Td>Per Share</Td>
                <Td>Total Value</Td>
              </Tr>
            </Thead>
            <Tbody>
              {Object.values(shares.data).map(
                ({ id, shareType, currentValue }) => (
                  <Tr key={id}>
                    <Td>{shareType}</Td>
                    <Td>{shareTotals[shareType].numShares.toLocaleString()}</Td>
                    <Td>${currentValue}</Td>
                    <Td>
                      ${shareTotals[shareType].valueShares.toLocaleString()}
                    </Td>
                  </Tr>
                )
              )}
            </Tbody>
          </Table>
          <StatGroup backgroundColor="teal.100">
            <Flex>
              <Stat p="8">
                <StatLabel>Total Valuation</StatLabel>
                <StatNumber>
                  ${shareTotals.total.valueShares.toLocaleString()}
                </StatNumber>
              </Stat>
              <Spacer />
              <Stat p="8">
                <StatLabel>Total Shares</StatLabel>
                <StatNumber>
                  {shareTotals.total.numShares.toLocaleString()}
                </StatNumber>
              </Stat>
            </Flex>
          </StatGroup>
        </Box>
        <Heading>Shareholders</Heading>
        <Table>
          <Thead>
            <Tr>
              <Td>Name</Td>
              <Td>Group</Td>
              <Td>Grants</Td>
              <Td>Shares</Td>
            </Tr>
          </Thead>
          <Tbody>
            {Object.values(shareholder.data).map((s) => (
              <Tr key={s.id}>
                <Td>
                  <Link to={`/shareholder/${s.id}`}>
                    <Stack direction="row" alignItems="center">
                      <Text color="teal.600">{s.name}</Text>
                      <ArrowForwardIcon color="teal.600" />
                    </Stack>
                  </Link>
                </Td>
                <Td data-testid={`shareholder-${s.name}-group`}>{s.group}</Td>
                <Td data-testid={`shareholder-${s.name}-grants`}>
                  {s.grants.length}
                </Td>
                <Td data-testid={`shareholder-${s.name}-shares`}>
                  {s.grants.reduce(
                    (acc, grantID) => acc + grant.data[grantID].amount,
                    0
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Button onClick={onOpen}>Add Shareholder</Button>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <Stack p="10" as="form" onSubmit={submitNewShareholder}>
              <Input
                value={newShareholder.name}
                placeholder="Shareholder Name"
                onChange={(e) =>
                  setNewShareholder((s) => ({ ...s, name: e.target.value }))
                }
              />
              <Select
                placeholder="Type of shareholder"
                value={newShareholder.group}
                onChange={(e) =>
                  setNewShareholder((s) => ({
                    ...s,
                    group: e.target.value as any,
                  }))
                }
              >
                <option value="investor">Investor</option>
                <option value="founder">Founder</option>
                <option value="employee">Employee</option>
              </Select>
              <Button type="submit" colorScheme="teal">
                Save
              </Button>
            </Stack>
          </ModalContent>
        </Modal>
      </Stack>
    </Stack>
  );
}
