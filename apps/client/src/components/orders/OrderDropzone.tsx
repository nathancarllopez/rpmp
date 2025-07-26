import { useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { Box, Container, Group, Stack, Text, Title } from "@mantine/core";
import { Dropzone, MIME_TYPES, type FileWithPath } from "@mantine/dropzone";
import { IconFileDescription, IconUpload, IconX } from "@tabler/icons-react";
import type { OrderReportInfo } from "@repo/global-types/types";
import { orderHeadersOptions } from "../../tanstack-query/queries/orderHeaders";
import { flavorsOptions } from "../../tanstack-query/queries/flavors";
import Papa from "papaparse";
import Subtitle from "../misc/Subtitle";
import { cleanParsedOrderData } from "../../business-logic/cleanParsedOrderData";

export interface OrderDropzoneProps {
  setOrderReportInfo: React.Dispatch<React.SetStateAction<OrderReportInfo>>;
  toNextStep: () => void;
}

export function OrderDropzone({
  setOrderReportInfo,
  toNextStep,
}: OrderDropzoneProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const atSmallBp = useMediaQuery("(min-width: 48em)");

  const { data: headerMapping, error: headerError } = useSuspenseQuery({
    ...orderHeadersOptions(),
    select: (data) =>
      data.reduce((mapping, headerRow) => {
        if (headerRow.rawLabel) {
          // Some of the headers are only used to display, not parse the raw data
          mapping[headerRow.name] = {
            label: headerRow.label,
            rawLabel: headerRow.rawLabel,
          };
        }
        return mapping;
      }, {} as { [name: string]: { label: string; rawLabel: string } }),
  });

  const { data: flavorMapping, error: flavorError } = useSuspenseQuery({
    ...flavorsOptions(),
    select: (data) =>
      data.reduce((mapping, flavorRow) => {
        mapping[flavorRow.rawLabel] = {
          flavor: flavorRow.name,
          flavorLabel: flavorRow.label,
        };
        return mapping;
      }, {} as { [rawLabel: string]: { flavor: string; flavorLabel: string } }),
  });

  const errors = [headerError, flavorError].filter((err) => !!err);
  if (errors.length > 0) {
    return (
      <Stack mt={"md"}>
        {errors.map((err, index) => (
          <Text key={index}>{err.message}</Text>
        ))}
      </Stack>
    );
  }

  const handleDrop = async (files: FileWithPath[]) => {
    setIsParsing(true);

    Papa.parse(files[0], {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
      complete: (results) => {
        const parseErrors = results.errors;

        if (parseErrors.length > 0) {
          setParseError(
            parseErrors.map((err) => JSON.stringify(err)).join("\n")
          );
          setIsParsing(false);
          return;
        }

        try {
          const { orderData, cleaningErrors } = cleanParsedOrderData(
            results.data as Record<string, string>[],
            headerMapping,
            flavorMapping
          );

          if (cleaningErrors.length > 0) {
            setParseError(
              cleaningErrors.map((err) => JSON.stringify(err)).join("\n")
            );
            return;
          }

          setOrderReportInfo((curr) => ({ ...curr, orderData }));
          toNextStep();
        } catch (error) {
          console.warn("Error occurred while parsing order upload:");

          if (error instanceof Error) {
            console.warn(error.message);
          } else {
            console.warn(JSON.stringify(error));
          }
        } finally {
          setIsParsing(false);
        }
      },
    });
  };

  const handleReject = () => {
    notifications.show({
      withCloseButton: true,
      color: "red",
      title: "Upload Failed",
      message: "Please upload a csv",
    });
  };

  return (
    <Stack mt={"md"}>
      <Dropzone
        onDrop={handleDrop}
        onReject={handleReject}
        accept={[MIME_TYPES.csv]}
        loading={isParsing}
        disabled={!!parseError}
      >
        <Group justify="center" mih={100} style={{ pointerEvents: "none" }}>
          <Dropzone.Idle>
            <IconFileDescription size={50} />
          </Dropzone.Idle>
          <Dropzone.Accept>
            <IconUpload size={50} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={50} />
          </Dropzone.Reject>

          <Container mx={0}>
            <Title order={atSmallBp ? 3 : 4} ta={"center"}>
              {atSmallBp
                ? "Drag and drop the order sheet here"
                : "Tap here to upload the order sheet"}
            </Title>
            <Box visibleFrom="sm">
              <Subtitle>
                You can also click to search for the order sheet
              </Subtitle>
            </Box>
          </Container>
        </Group>
      </Dropzone>

      {parseError && (
        <>
          <Text>Issue parsing order:</Text>
          <Text>{parseError}</Text>
        </>
      )}
    </Stack>
  );
}