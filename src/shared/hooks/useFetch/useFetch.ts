import { useCallback, useReducer } from "react";
import { AxiosPromise } from "axios";
import { ActionType, createAsyncAction, getType } from "typesafe-actions";

export const {
  request: fetchRequest,
  success: fetchSuccess,
  failure: fetchFailure,
} = createAsyncAction(
  "useFetch/fetch/request",
  "useFetch/fetch/success",
  "useFetch/fetch/failure"
)<void, any, any>();

type State = Readonly<{
  isFetching: boolean;
  data?: any;
  fetchError?: any;
  fetchCount: number;
}>;

const defaultState: State = {
  isFetching: false,
  data: undefined,
  fetchError: undefined,
  fetchCount: 0,
};

type Action = ActionType<
  typeof fetchRequest | typeof fetchSuccess | typeof fetchFailure
>;

const initReducer = (isFetching: boolean): State => {
  return {
    ...defaultState,
    isFetching,
  };
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case getType(fetchRequest):
      return {
        ...state,
        isFetching: true,
      };
    case getType(fetchSuccess):
      return {
        ...state,
        isFetching: false,
        fetchError: undefined,
        data: action.payload,
        fetchCount: state.fetchCount + 1,
      };
    case getType(fetchFailure):
      return {
        ...state,
        isFetching: false,
        fetchError: action.payload,
        fetchCount: state.fetchCount + 1,
      };
    default:
      return state;
  }
};

export interface IArgs<T> {
  defaultIsFetching?: boolean;
  onFetch?: () => AxiosPromise<T>;
  onFetchPromise?: () => Promise<T>;
}

export interface IState<T> {
  data?: T;
  isFetching: boolean;
  fetchError?: any;
  fetchCount: number;
  requestFetch: () => void;
}

export const useFetch = <T>({
  defaultIsFetching = false,
  onFetch,
  onFetchPromise,
}: IArgs<T>): IState<T> => {
  const [state, dispatch] = useReducer(reducer, defaultIsFetching, initReducer);

  const fetchHandler = useCallback(() => {
    dispatch(fetchRequest());

    let promise;
    if (onFetch) {
      promise = onFetch().then(({ data }) => {
        dispatch(fetchSuccess(data));
      });
    } else if (onFetchPromise) {
      promise = onFetchPromise().then((data) => {
        dispatch(fetchSuccess(data));
      });
    } else {
      throw new Error("No onFetch nor onFetchPromise provided");
    }

    promise.catch((error) => {
      dispatch(fetchFailure(error));
    });
  }, [onFetch, onFetchPromise]);

  return {
    data: state.data,
    isFetching: state.isFetching,
    fetchError: state.fetchError,
    fetchCount: state.fetchCount,
    requestFetch: fetchHandler,
  };
};

export default useFetch;
