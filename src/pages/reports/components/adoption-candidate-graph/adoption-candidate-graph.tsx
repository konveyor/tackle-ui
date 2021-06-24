import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Measure from "react-measure";

import {
  Bullseye,
  Checkbox,
  Skeleton,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import {
  Chart,
  ChartAxis,
  ChartGroup,
  ChartLine,
  ChartScatter,
  ChartThemeColor,
  ChartTooltip,
} from "@patternfly/react-charts";
import { global_palette_black_800 as black } from "@patternfly/react-tokens";

import { useFetch, useFetchApplicationDependencies } from "shared/hooks";
import { ConditionalRender, StateError } from "shared/components";

import { EFFORT_ESTIMATE_LIST, PROPOSED_ACTION_LIST } from "Constants";
import { getAssessmentConfidence } from "api/rest";
import { Application, AssessmentConfidence, ProposedAction } from "api/models";

import { ApplicationSelectionContext } from "../../application-selection-context";
import { CartesianSquare } from "./cartesian-square";
import { Arrow } from "./arrow";

interface Line {
  from: LinePoint;
  to: LinePoint;
}

interface LinePoint {
  x: number;
  y: number;
  size: number;
  application: Application;
}

interface BubblePoint extends LinePoint {
  legend: Legend;
}

interface Legend {
  name: string;
  hexColor: string;
}

interface Serie {
  legend: Legend;
  datapoints: LinePoint[];
}

type ProposedActionChartDataListType = {
  [key in ProposedAction]: Serie;
};

const defaultChartData: ProposedActionChartDataListType = {
  rehost: {
    legend: {
      name: PROPOSED_ACTION_LIST["rehost"].label,
      hexColor: PROPOSED_ACTION_LIST["rehost"].hexColor,
    },
    datapoints: [],
  },
  replatform: {
    legend: {
      name: PROPOSED_ACTION_LIST["replatform"].label,
      hexColor: PROPOSED_ACTION_LIST["replatform"].hexColor,
    },
    datapoints: [],
  },
  refactor: {
    legend: {
      name: PROPOSED_ACTION_LIST["refactor"].label,
      hexColor: PROPOSED_ACTION_LIST["refactor"].hexColor,
    },
    datapoints: [],
  },
  repurchase: {
    legend: {
      name: PROPOSED_ACTION_LIST["repurchase"].label,
      hexColor: PROPOSED_ACTION_LIST["repurchase"].hexColor,
    },
    datapoints: [],
  },
  retire: {
    legend: {
      name: PROPOSED_ACTION_LIST["retire"].label,
      hexColor: PROPOSED_ACTION_LIST["retire"].hexColor,
    },
    datapoints: [],
  },
  retain: {
    legend: {
      name: PROPOSED_ACTION_LIST["retain"].label,
      hexColor: PROPOSED_ACTION_LIST["retain"].hexColor,
    },
    datapoints: [],
  },
};

export const AdoptionCandidateGraph: React.FC = () => {
  // Context
  const { selectedItems: applications } = useContext(
    ApplicationSelectionContext
  );

  // Checkboxes
  const [showDependencies, setShowDependencies] = useState(true);

  // Confidence
  const fetchChartData = useCallback(() => {
    if (applications.length > 0) {
      return getAssessmentConfidence(applications.map((f) => f.id!)).then(
        ({ data }) => data
      );
    } else {
      return Promise.resolve([]);
    }
  }, [applications]);

  const {
    data: confidences,
    isFetching,
    fetchError,
    requestFetch: refreshChart,
  } = useFetch<AssessmentConfidence[]>({
    defaultIsFetching: true,
    onFetchPromise: fetchChartData,
  });

  useEffect(() => {
    refreshChart();
  }, [applications, refreshChart]);

  // Dependencies
  const {
    applicationDependencies: dependencies,
    fetchAllApplicationDependencies: fetchAllDependencies,
  } = useFetchApplicationDependencies();

  useEffect(() => {
    fetchAllDependencies({});
  }, [fetchAllDependencies]);

  // Chart data
  const legendAndPoints: ProposedActionChartDataListType = useMemo(() => {
    if (!confidences) {
      return defaultChartData;
    }

    return applications.reduce((prev, current) => {
      const appConfidence = confidences.find(
        (elem) => elem.applicationId === current.id
      );

      if (appConfidence && current.review) {
        const key = current.review.proposedAction;
        const value = prev[current.review.proposedAction];

        // Create new datapoint
        const effortData = EFFORT_ESTIMATE_LIST[current.review.effortEstimate];
        const datapoint: LinePoint = {
          x: appConfidence.confidence,
          y: current.review.businessCriticality,
          size: effortData ? effortData.size : 0,
          application: { ...current },
        };

        // Process result
        const newValue: Serie = {
          ...value,
          datapoints: [...value.datapoints, datapoint],
        };

        const result: ProposedActionChartDataListType = {
          ...prev,
          [key]: newValue,
        };
        return result;
      }

      return prev;
    }, defaultChartData);
  }, [confidences, applications]);

  const bubblePoints: BubblePoint[] = useMemo(() => {
    return Object.keys(legendAndPoints)
      .map((key) => {
        const serie = legendAndPoints[key as ProposedAction];

        const legend = serie.legend;
        const datapoints = serie.datapoints;

        const result: BubblePoint[] = datapoints.map((f) => {
          const flatPoint: BubblePoint = { ...f, legend: legend };
          return flatPoint;
        });
        return result;
      })
      .flatMap((f) => f)
      .sort((a, b) => b.size - a.size);
  }, [legendAndPoints]);

  const lines = useMemo(() => {
    if (!dependencies) {
      return [];
    }

    const points = Object.keys(legendAndPoints)
      .map((key) => legendAndPoints[key as ProposedAction].datapoints)
      .flatMap((f) => f);

    return dependencies.data.reduce((prev, current) => {
      const fromPoint = points.find(
        (f) => f.application.id === current.from.id
      );
      const toPoint = points.find((f) => f.application.id === current.to.id);

      if (fromPoint && toPoint) {
        const a = fromPoint.x - toPoint.x;
        const b = fromPoint.y - toPoint.y;
        const distance = Math.sqrt(a * a + b * b);
        if (distance > 0) {
          const line: Line = { from: fromPoint, to: toPoint };
          return [...prev, line];
        }
      }

      return prev;
    }, [] as Line[]);
  }, [legendAndPoints, dependencies]);

  if (fetchError) {
    return <StateError />;
  }

  return (
    <ConditionalRender
      when={isFetching}
      then={
        <Bullseye>
          <div style={{ height: 200, width: 400 }}>
            <Skeleton height="75%" width="100%" />
          </div>
        </Bullseye>
      }
    >
      <Stack hasGutter>
        <StackItem>
          <Checkbox
            id="show-dependencies"
            name="show-dependencies"
            label="Dependencies"
            isChecked={showDependencies}
            onChange={() => setShowDependencies((current) => !current)}
          />
        </StackItem>
        <StackItem isFilled>
          <Measure bounds>
            {({ measureRef, contentRect }) => {
              const chartHeight = 600;
              const chartWidth = contentRect.bounds?.width || 400;
              const chartPadding = {
                bottom: 100,
                left: 75,
                right: 50,
                top: 50,
              };

              return (
                <div ref={measureRef}>
                  <div
                    style={{
                      height: chartHeight,
                      width: chartWidth,
                    }}
                  >
                    <Chart
                      themeColor={ChartThemeColor.gray}
                      legendPosition="bottom-left"
                      legendData={Object.keys(legendAndPoints).map((key) => {
                        const serie = legendAndPoints[key as ProposedAction];
                        const legend = serie.legend;
                        return {
                          name: legend.name,
                          symbol: {
                            fill: legend.hexColor,
                          },
                        };
                      })}
                      padding={chartPadding}
                      height={chartHeight}
                      width={chartWidth}
                      domain={{ x: [0, 100], y: [0, 10] }}
                    >
                      <ChartAxis
                        label="Confidence"
                        showGrid
                        tickValues={[
                          0,
                          10,
                          20,
                          30,
                          40,
                          50,
                          60,
                          70,
                          80,
                          90,
                          100,
                        ]}
                        tickLabelComponent={<></>}
                        style={{
                          axisLabel: { fontSize: 20, padding: 30 },
                        }}
                      />
                      <ChartAxis
                        label="Business criticality"
                        showGrid
                        dependentAxis
                        tickValues={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                        tickLabelComponent={<></>}
                        style={{
                          axisLabel: { fontSize: 20, padding: 30 },
                        }}
                      />
                      <CartesianSquare
                        height={chartHeight}
                        width={chartWidth}
                        padding={chartPadding}
                      />
                      <ChartGroup>
                        <ChartScatter
                          key={"scatter-1"}
                          name={"scatter-1"}
                          data={bubblePoints}
                          labels={({ datum }) => {
                            const point = datum as BubblePoint;
                            return point.application.name;
                          }}
                          labelComponent={
                            <ChartTooltip
                              dy={({ datum }) => {
                                const point = datum as BubblePoint;
                                return 0 - point.size;
                              }}
                            />
                          }
                          style={{
                            data: {
                              fill: ({ datum }) => {
                                const point = datum as BubblePoint;
                                return point.legend.hexColor;
                              },
                            },
                          }}
                        />
                      </ChartGroup>
                      {showDependencies &&
                        lines.map((line, i) => (
                          <ChartLine
                            key={"line-" + i}
                            name={"line-" + i}
                            data={[
                              { x: line.from.x, y: line.from.y },
                              {
                                x: line.to.x,
                                y: line.to.y,
                              },
                            ]}
                            style={{
                              data: { stroke: black.value, strokeWidth: 2 },
                            }}
                            dataComponent={<Arrow />}
                            groupComponent={<g></g>}
                          />
                        ))}
                    </Chart>
                  </div>
                </div>
              );
            }}
          </Measure>
        </StackItem>
      </Stack>
    </ConditionalRender>
  );
};
