import React, { useState } from "react";
import { Modal, Typography, Button } from "antd";

import WeeklyForecastTable from "./WeeklyForecastTable";

const { Link } = Typography;

const WeeklyTableModal = ({ tableWeeklyData }) => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <Link onClick={() => setOpenModal(true)}>Open Table</Link>
      <Modal
        title="Weekly Forecast Table"
        visible={openModal}
        onCancel={() => setOpenModal(false)}
        footer={[
          <Button key="back" onClick={() => setOpenModal(false)}>
            Return
          </Button>,
        ]}
      >
        <WeeklyForecastTable tableWeeklyData={tableWeeklyData} />
      </Modal>
    </>
  );
};

export default WeeklyTableModal;
