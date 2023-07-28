import { useRef, useState } from "react";

import classes from "./evaluation-model.module.css";

import ModalComponent from "../subcomponents/modal-component";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

function EvaluationModel(props) {
  let AccArr = [];
  for (const key in props.myAccuracy) {
    AccArr.push(props.myAccuracy[key] / 100000);
  }

  const graphData = {
    labels: new Array(AccArr.length).fill("*"),
    datasets: [{ data: AccArr, label: "Accuracy" }],
  };

  const graphOptions = {
    plugins: {
      legend: {
        // display: false,
      },
    },
    elements: {
      line: {
        borderWidth: 3,
        borderColor: "rgba(0, 171, 225,0.9)",
        fill: "start",
        backgroundColor: "rgba(0, 171, 225,0.2)",
      },
      point: {
        radius: 10,
      },
    },
    scales: {
      yAxis: {
        title: {
          display: true,
          text: "Accuracy",
          font: {
            size: 20,
          },
        },
        // max: 1,
        // min: 0,
      },
      xAxis: {
        display: false,
      },
    },
  };

  return (
    <div>
      <ModalComponent
        myName={props.myName}
        myDescription={props.myDescription}
      />
      <div className={classes.graph}>
        <Line data={graphData} options={graphOptions} />
      </div>
    </div>
  );
}

export default EvaluationModel;
