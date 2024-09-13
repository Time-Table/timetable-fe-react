import TimeGrid from "../../../../component/TimeGrid";

export default function AllTimeGrid(dates, startHour, endHour) {
  console.log(dates, startHour, endHour);
  return <>{TimeGrid(dates, startHour, endHour)}</>;
}
