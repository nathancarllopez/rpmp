import { Alert, Button, Stack, Text } from "@mantine/core";
import { useMemo, useState } from "react";
import Timecard from "./Timecard";
import { useToggle } from "@mantine/hooks";
import { IconMessageReport } from "@tabler/icons-react";
import formatTimecardsData from "../../util/formatTimecardsData";
import fetchTimecardsUrl from "../../api/fetchTimecardsUrl";
import { startBeforeEnd } from "../../util/timecardValidation";
import type { TimecardValues } from "../../types/types";

interface TimecardsFormProps {
  timecardsData: TimecardValues[];
  setTimecardsData: React.Dispatch<React.SetStateAction<TimecardValues[]>>;
  initialTimecardsData: TimecardValues[];
  setTimecardsUrl: React.Dispatch<React.SetStateAction<string | null>>;
  toNextStep: () => void;
}

export default function TimecardsForm({
  timecardsData,
  setTimecardsData,
  initialTimecardsData,
  setTimecardsUrl,
  toNextStep,
}: TimecardsFormProps) {
  const [collapsedTimecards, setCollapsedTimecards] = useState(() =>
    timecardsData.map(() => true)
  );
  const [allFormErrors, setAllFormErrors] = useState<Record<string, string>[]>(
    () => timecardsData.map(() => ({}))
  );
  const [showErrorAlert, toggleErrorAlert] = useToggle();

  const someTimecardDirty = useMemo(
    () => timecardsData.some((timecard) => timecard.hasChanged),
    [timecardsData]
  );
  const someGrandTotalPositive = useMemo(() => timecardsData.some((timecard) => timecard.grandTotal > 0), [timecardsData]);
  const disableCreateButton = !someTimecardDirty || !someGrandTotalPositive;

  const toggleCollapsed = (index: number) =>
    setCollapsedTimecards((curr) => {
      const copy = [...curr];
      copy[index] = !copy[index];
      return copy;
    });

  const updateTimecard = (index: number, values: TimecardValues) =>
    setTimecardsData((curr) => {
      const copy = [...curr];
      copy[index] = values;
      return copy;
    });

  const resetTimecard = (index: number) =>
    setTimecardsData((curr) => {
      const copy = [...curr];
      const renderKey = curr[index].renderKey;

      copy[index] = {
        ...initialTimecardsData[index],
        renderKey: renderKey + 1,
      };
      return copy;
    });

  const handleSubmit = async () => {
    const validationErrors = validateTimecards(timecardsData);
    if (validationErrors !== null) {
      setAllFormErrors(validationErrors);
      setTimecardsData((curr) =>
        curr.map((timecard) => {
          const renderKey = timecard.renderKey;
          return { ...timecard, renderKey: renderKey + 1 };
        })
      );

      toggleErrorAlert();
      setTimeout(() => toggleErrorAlert(), 5000);

      return;
    }

    const timecardsDisplayData = formatTimecardsData(timecardsData);
    const url = await fetchTimecardsUrl(timecardsDisplayData);
    
    setTimecardsUrl(url);
    toNextStep();
  };

  return (
    <Stack>
      <Button disabled={disableCreateButton} onClick={handleSubmit}>
        Create
      </Button>

      {showErrorAlert && (
        <Alert
          variant="light"
          color="red"
          title="Timecard Errors"
          icon={<IconMessageReport />}
        >
          Please check the timecards for errors
        </Alert>
      )}

      {timecardsData.length === 0 && (
        <Text>No employees with driving rate or kitchen rate found</Text>
      )}

      {timecardsData.map((timecardVals, index) => {
        const formErrors = allFormErrors[index];
        const isCollapsed = collapsedTimecards[index];
        return (
          <Timecard
            key={timecardVals.fullName + timecardVals.renderKey}
            isCollapsed={isCollapsed}
            toggleCollapsed={() => toggleCollapsed(index)}
            timecardVals={timecardVals}
            formErrors={formErrors}
            updateTimecard={(values) => updateTimecard(index, values)}
            resetTimecard={() => resetTimecard(index)}
          />
        );
      })}
    </Stack>
  );
}

function validateTimecards(
  timecardsData: TimecardValues[]
): Record<string, string>[] | null {
  let errorsFound = false;
  const validationErrors = timecardsData.map((timecard) => {
    const errors: Record<string, string> = {};
    const {
      sundayStart,
      sundayEnd,
      mondayStart,
      mondayEnd,
      drivingStart,
      drivingEnd,
      route1,
      route2,
      miscDescription,
      miscAmount,
      miscPayCode,
    } = timecard;

    const timePairs = [
      [sundayStart, sundayEnd, "sunday"],
      [mondayStart, mondayEnd, "monday"],
      [drivingStart, drivingEnd, "driving"],
    ];
    const missingMessage = "Both times need to be entered";
    timePairs.forEach(([start, end, keyPrefix]) => {
      const wrongOrderMessage: string | null = startBeforeEnd(start, end);
      if (wrongOrderMessage !== null) {
        errorsFound = true;
        errors[keyPrefix + "Start"] = wrongOrderMessage;
        errors[keyPrefix + "End"] = wrongOrderMessage;
      }

      if (!!start !== !!end) {
        errorsFound = true;
        if (!start) {
          errors[keyPrefix + "Start"] = missingMessage;
        } else {
          errors[keyPrefix + "End"] = missingMessage;
        }
      }
    });

    const routes = [route1, route2];
    routes.forEach((route, index) => {
      if (route && (!drivingStart || !drivingEnd)) {
        errorsFound = true;
        errors[`route${index + 1}`] = "Enter driving start and end time";
      }
    });

    const misc = [
      {
        value: miscDescription,
        others: [miscAmount, miscPayCode],
        key: "miscDescription",
        message: "Enter payment description",
      },
      {
        value: miscAmount,
        others: [miscDescription, miscPayCode],
        key: "miscAmount",
        message: "Enter payment amount",
      },
      {
        value: miscPayCode,
        others: [miscAmount, miscDescription],
        key: "miscPayCode",
        message: "Enter pay code",
      },
    ];
    misc.forEach(({ value, others, key, message }) => {
      if (!value && others.some((other) => !!other)) {
        errorsFound = true;
        errors[key] = message;
      }
    });

    return errors;
  });

  if (errorsFound) {
    return validationErrors;
  }

  return null;
}