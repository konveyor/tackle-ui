import { useCallback, useState } from "react";
import { AxiosError } from "axios";

import { createAssessment, getAssessments } from "api/rest";
import { Application, Assessment } from "api/models";

export interface IState {
  inProgress: boolean;
  assessApplication: (
    application: Application,
    onSuccess: (assessment: Assessment) => void,
    onError: (error: AxiosError) => void
  ) => void;
}

export const useAssessApplication = (): IState => {
  const [inProgress, setInProgress] = useState(false);

  const assessApplicationHandler = useCallback(
    (
      application: Application,
      onSuccess: (assessment: Assessment) => void,
      onError: (error: AxiosError) => void
    ) => {
      if (!application.id) {
        throw new Error("Entity must have 'id' to execute this operation");
      }

      setInProgress(true);
      getAssessments({ applicationId: application.id })
        .then(({ data }) => {
          const currentAssessment: Assessment | undefined = data[0];

          const newAssessment = {
            applicationId: application.id,
          } as Assessment;

          return Promise.all([
            currentAssessment,
            !currentAssessment ? createAssessment(newAssessment) : undefined,
          ]);
        })
        .then(([currentAssessment, newAssessment]) => {
          setInProgress(false);
          onSuccess(currentAssessment || newAssessment!.data);
        })
        .catch((error: AxiosError) => {
          setInProgress(false);
          onError(error);
        });
    },
    []
  );

  return {
    inProgress: inProgress,
    assessApplication: assessApplicationHandler,
  };
};

export default useAssessApplication;
