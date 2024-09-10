import { useFunnel } from "@use-funnel/react-router-dom";
import CreatePage1 from "./CreatePage1";
import CreatePage2 from "./CreatePage2";
import CreatePage3 from "./CreatePage3";

export default function CreatePage() {
  const funnel = useFunnel({
    id: "createPage",
    initial: {
      step: "CreatePage1",
      context: {},
    },
  });

  return (
    <funnel.Render
      CreatePage1={({ history, context }) => (
        <CreatePage1
          onNext={(dates) => history.push("CreatePage2", { dates })}
          dates={context?.dates ?? []}
        />
      )}
      CreatePage2={({ history, context }) => (
        <CreatePage2
          dates={context.dates}
          startHour={context?.startHour}
          endHour={context?.endHour}
          tableTitle={context?.tableTitle}
          endTimeClicked={context.endTimeClicked}
          onNext={(startHour, endHour, tableTitle, endTimeClicked) => {
            history.push("CreatePage3", { startHour, endHour, tableTitle, endTimeClicked });
          }}
          onBack={(dates) => {
            history.push("CreatePage1", { dates });
          }}
        />
      )}
      CreatePage3={({ context, history }) => (
        <CreatePage3
          dates={context.dates}
          startHour={context.startHour}
          endHour={context.endHour}
          tableTitle={context.tableTitle}
          endTimeClicked={context.endTimeClicked}
          onBack={(startHour, endHour, tableTitle, endTimeClicked) => {
            history.push("CreatePage2", { startHour, endHour, tableTitle, endTimeClicked });
          }}
        />
      )}
    />
  );
}
