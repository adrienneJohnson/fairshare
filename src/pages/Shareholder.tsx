import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  Text,
  Heading,
  Stack,
  Button,
  Input,
  Table,
  Thead,
  Tr,
  Tbody,
  Td,
  FormControl,
  Modal,
  useDisclosure,
  ModalContent,
  Spinner,
  Alert,
  AlertTitle,
  AlertIcon,
  Card,
  CardBody,
  TableCaption,
  Select,
} from "@chakra-ui/react";
import { ReactComponent as Avatar } from "../assets/avatar-male.svg";
import { Company, Grant, Share, ShareType, Shareholder } from "../types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import produce from "immer";
import { ShareTypes } from "../consts";

export function ShareholderPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { shareholderID = "" } = useParams();
  const grantQuery = useQuery<{ [dataID: number]: Grant }>("grants", () =>
    fetch("/grants").then((e) => e.json())
  );
  const shareholderQuery = useQuery<Shareholder>("shareholder", () =>
    fetch(`/shareholders/${shareholderID}`).then((e) => e.json())
  );
  // This is needed by candidates, and put here early so candidates don't get caught up on react-query
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const companyQuery = useQuery<Company>("company", () =>
    fetch("/company").then((e) => e.json())
  );

  const shareQuery = useQuery<{ [dataID: number]: Share }>("shares", () =>
    fetch("/shares").then((e) => e.json())
  );

  const [draftGrant, setDraftGrant] = React.useState<Omit<Grant, "id">>({
    name: "",
    amount: 0,
    issued: "",
    type: ShareTypes.Common,
  });
  const grantMutation = useMutation<Grant, unknown, Omit<Grant, "id">>(
    (grant) =>
      fetch("/grant/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareholderID: parseInt(shareholderID, 10),
          grant,
        }),
      }).then((res) => res.json()),
    {
      onSuccess: (data) => {
        // this doesn't seem to triggering an instant re-render on consumers even though thats that it should ...
        /// https://github.com/tannerlinsley/react-query/issues/326
        queryClient.setQueryData<{ [id: number]: Shareholder } | undefined>(
          "shareholders",
          (s) => {
            if (s)
              return produce(s, (draft) => {
                draft[parseInt(shareholderID, 10)].grants.push(data.id);
              });
          }
        );
        queryClient.setQueriesData<{ [id: number]: Grant } | undefined>(
          "grants",
          (g) => {
            if (g) {
              return produce(g, (draft) => {
                draft[data.id] = data;
              });
            }
          }
        );
      },
    }
  );
  async function submitGrant(e: React.FormEvent) {
    e.preventDefault();
    try {
      await grantMutation.mutateAsync(draftGrant);
      onClose();
      setDraftGrant({
        name: "",
        amount: 0,
        issued: "",
        type: ShareTypes.Common,
      });
    } catch (e) {
      console.warn(e);
    }
  }

  if (
    grantQuery.status !== "success" ||
    shareholderQuery.status !== "success" ||
    shareQuery.status !== "success"
  ) {
    return <Spinner />;
  }

  if ("errorMessage" in shareholderQuery.data) {
    return (
      <>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>
            Error: {`${shareholderQuery.data.errorMessage}`}
          </AlertTitle>
        </Alert>
        <Card>
          <CardBody>
            Click{" "}
            <Link to="/dashboard">
              <Text color="teal.500">here</Text>
            </Link>
            to view the full list of shareholders.
          </CardBody>
        </Card>
      </>
    );
  }

  if (!grantQuery.data || !shareQuery.data) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error: {grantQuery.error}</AlertTitle>
      </Alert>
    );
  }

  const shareholder = shareholderQuery.data;
  const shareTypes = Object.values(shareQuery.data);

  const calculateShareValue = (
    shareTypes: Share[],
    type: string,
    amount: number
  ) => {
    const shareType = shareTypes.find((st) => st.shareType === type);

    if (shareType) {
      return "$" + (parseFloat(shareType.value) * amount).toLocaleString();
    } else {
      return "N/A";
    }
  };

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
      </Stack>
      <Heading size="md" textAlign="center">
        Shareholder
      </Heading>
      <Stack direction="row" spacing="8">
        <Avatar width="100px" height="auto" />
        <Stack>
          <Text fontSize="xl" fontWeight="bold">
            {shareholder.name}
          </Text>
          <Text fontSize="sm" fontWeight="thin">
            <strong data-testid="grants-issued">
              {shareholder.grants.length}
            </strong>{" "}
            grants issued
          </Text>
          <Text fontSize="sm" fontWeight="thin">
            <strong data-testid="shares-granted">
              {shareholder.grants.reduce(
                (acc, grantID) => acc + grantQuery.data[grantID].amount,
                0
              )}
            </strong>{" "}
            shares
          </Text>
        </Stack>
      </Stack>
      <Heading size="md" textAlign="center">
        Grants
      </Heading>
      <Table size="s">
        <Thead>
          <Tr>
            <Td>Occasion</Td>
            <Td>Date</Td>
            <Td>Amount</Td>
            <Td>Class</Td>
            <Td>Value</Td>
          </Tr>
        </Thead>
        <Tbody role="rowgroup">
          {shareholderQuery.data.grants.map((grantID) => {
            const { name, issued, amount, type } = grantQuery.data[grantID];
            return (
              <Tr key={grantID}>
                <Td>{name}</Td>
                <Td>{new Date(issued).toLocaleDateString()}</Td>
                <Td>{amount.toLocaleString()}</Td>
                <Td>{type}</Td>
                <Td>{calculateShareValue(shareTypes, type, amount)}</Td>
              </Tr>
            );
          })}
        </Tbody>
        <TableCaption>
          <Button colorScheme="teal" onClick={onOpen}>
            Add Grant
          </Button>
        </TableCaption>
      </Table>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <Stack p="10" as="form" onSubmit={submitGrant}>
            <Text>
              A <strong>Grant</strong> is any occasion where new shares are
              issued to a shareholder.
            </Text>

            <FormControl>
              <Input
                variant="flushed"
                placeholder="Name"
                data-testid="grant-name"
                value={draftGrant.name}
                onChange={(e) =>
                  setDraftGrant((g) => ({ ...g, name: e.target.value }))
                }
              />
            </FormControl>
            <FormControl>
              <Select
                variant="flushed"
                placeholder="Type of share"
                data-testid="grant-share-type"
                value={draftGrant.type}
                onChange={(e) =>
                  setDraftGrant((g) => ({
                    ...g,
                    type: e.target.value as ShareType,
                  }))
                }
              >
                {shareTypes.map((s) => (
                  <option value={s.shareType} key={s.id}>
                    {s.shareType}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <Input
                variant="flushed"
                placeholder="Shares"
                data-testid="grant-amount"
                type="number"
                value={draftGrant.amount || ""}
                onChange={(e) =>
                  setDraftGrant((g) => ({
                    ...g,
                    amount: parseInt(e.target.value, 10),
                  }))
                }
              />
            </FormControl>
            <FormControl>
              <Input
                variant="flushed"
                type="date"
                data-testid="grant-issued"
                value={draftGrant.issued}
                onChange={(e) =>
                  setDraftGrant((g) => ({ ...g, issued: e.target.value }))
                }
              />
            </FormControl>
            <Button type="submit">Save</Button>
          </Stack>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
