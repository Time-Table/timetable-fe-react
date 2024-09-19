import { useState } from "react";
import TimeGrid from "../../../../component/TimeGrid";

export default function AllTimeGrid({ dates, startHour, endHour }) {
  const [selectedCells, setSelectedCells] = useState([]);

  return (
    <TimeGrid
      dates={dates}
      startHour={startHour}
      endHour={endHour}
      selectedCells={selectedCells}
      setSelectedCells={setSelectedCells}
    />
  );
}
