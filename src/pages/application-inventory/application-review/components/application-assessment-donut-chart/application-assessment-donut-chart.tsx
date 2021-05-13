import React, { useMemo } from "react";
import { ChartDonut } from "@patternfly/react-charts";

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

  return (
    <div style={{ height: "230px", width: "230px" }}>
      <ChartDonut
        ariaDesc="risk-donut-chart"
        constrainToVisibleArea={true}
        data={[
          { x: DEFAULT_RISK_LABELS.get("GREEN")?.label, y: charData.green },
          { x: DEFAULT_RISK_LABELS.get("AMBER")?.label, y: charData.amber },
          { x: DEFAULT_RISK_LABELS.get("RED")?.label, y: charData.red },
          { x: DEFAULT_RISK_LABELS.get("UNKNOWN")?.label, y: charData.unknown },
        ]}
        labels={({ datum }) => `${datum.x}: ${datum.y}`}
        colorScale={["#68b240", "#f0ab0b", "#cb440d", black.value]}
        innerRadius={50}
      />
    </div>
  );
};
