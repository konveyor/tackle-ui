import React, { useMemo } from "react";
import { ChartDonut, ChartLegend } from "@patternfly/react-charts";

import { global_palette_black_400 as black } from "@patternfly/react-tokens";

import { DEFAULT_RISK_LABELS } from "Constants";
import { Assessment, QuestionnaireCategory } from "api/models";

export interface ChartData {
  red: number;
  amber: number;
  green: number;
  unknown: number;
}

export const getChartDataFromCategories = (
  categories: QuestionnaireCategory[]
): ChartData => {
  let green = 0;
  let amber = 0;
  let red = 0;
  let unknown = 0;

  categories
    .flatMap((f) => f.questions)
    .flatMap((f) => f.options)
    .filter((f) => f.checked === true)
    .forEach((f) => {
      switch (f.risk) {
        case "GREEN":
          green++;
          break;
        case "AMBER":
          amber++;
          break;
        case "RED":
          red++;
          break;
        default:
          unknown++;
      }
    });

  return {
    red,
    amber,
    green,
    unknown,
  } as ChartData;
};

export interface IApplicationAssessmentDonutChartProps {
  assessment: Assessment;
}

export const ApplicationAssessmentDonutChart: React.FC<IApplicationAssessmentDonutChartProps> = ({
  assessment,
}) => {
  const charData: ChartData = useMemo(() => {
    return getChartDataFromCategories(assessment.questionnaire.categories);
  }, [assessment]);

  const chartDefinition = [
    {
      x: DEFAULT_RISK_LABELS.get("GREEN")?.label,
      y: charData.green,
      color: "#68b240",
    },
    {
      x: DEFAULT_RISK_LABELS.get("AMBER")?.label,
      y: charData.amber,
      color: "#f0ab0b",
    },
    {
      x: DEFAULT_RISK_LABELS.get("RED")?.label,
      y: charData.red,
      color: "#cb440d",
    },
    {
      x: DEFAULT_RISK_LABELS.get("UNKNOWN")?.label,
      y: charData.unknown,
      color: black.value,
    },
  ].filter((f) => f.y > 0);

  return (
    <div style={{ height: "250px", width: "380px" }}>
      <ChartDonut
        ariaDesc="risk-donut-chart"
        constrainToVisibleArea={true}
        data={chartDefinition.map((elem) => ({ x: elem.x, y: elem.y }))}
        labels={({ datum }) => `${datum.x}: ${datum.y}`}
        colorScale={chartDefinition.map((elem) => elem.color)}
        legendComponent={
          <ChartLegend
            data={chartDefinition.map((elem) => ({
              name: `${elem.x}: ${elem.y}`,
            }))}
            colorScale={chartDefinition.map((elem) => elem.color)}
          />
        }
        legendOrientation="vertical"
        legendPosition="right"
        padding={{
          bottom: 20,
          left: 20,
          right: 140, // Adjusted to accommodate legend
          top: 20,
        }}
        innerRadius={50}
        width={380}
      />
    </div>
  );
};
