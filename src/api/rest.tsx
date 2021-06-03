import { AxiosPromise } from "axios";
import { APIClient } from "axios-config";

import {
  PageQuery,
  BusinessService,
  BusinessServicePage,
  Stakeholder,
  StakeholderPage,
  StakeholderGroup,
  StakeholderGroupPage,
  JobFunctionPage,
  ApplicationPage,
  Application,
  Assessment,
  JobFunction,
  ApplicationDependencyPage,
  ApplicationDependency,
  TagTypePage,
  TagType,
  Tag,
  Review,
  AssessmentRisk,
} from "./models";

export const CONTROLS_BASE_URL = "controls";
export const APP_INVENTORY_BASE_URL = "application-inventory";
export const PATHFINDER_BASE_URL = "pathfinder";

export const BUSINESS_SERVICES = CONTROLS_BASE_URL + "/business-service";
export const STAKEHOLDERS = CONTROLS_BASE_URL + "/stakeholder";
export const STAKEHOLDER_GROUPS = CONTROLS_BASE_URL + "/stakeholder-group";
export const JOB_FUNCTIONS = CONTROLS_BASE_URL + "/job-function";
export const TAG_TYPES = CONTROLS_BASE_URL + "/tag-type";
export const TAGS = CONTROLS_BASE_URL + "/tag";

export const APPLICATIONS = APP_INVENTORY_BASE_URL + "/application";
export const APPLICATION_DEPENDENCY =
  APP_INVENTORY_BASE_URL + "/applications-dependency";
export const REVIEW = APP_INVENTORY_BASE_URL + "/review";

export const ASSESSMENTS = PATHFINDER_BASE_URL + "/assessments";

const headers = { Accept: "application/hal+json" };

type Direction = "asc" | "desc";

const buildQuery = (params: any) => {
  const query: string[] = [];

  Object.keys(params).forEach((key) => {
    const value = (params as any)[key];

    if (value !== undefined && value !== null) {
      let queryParamValues: string[] = [];
      if (Array.isArray(value)) {
        queryParamValues = value;
      } else {
        queryParamValues = [value];
      }
      queryParamValues.forEach((v) => query.push(`${key}=${v}`));
    }
  });

  return query;
};

// Business services

export enum BusinessServiceSortBy {
  NAME,
  OWNER,
}
export interface BusinessServiceSortByQuery {
  field: BusinessServiceSortBy;
  direction?: Direction;
}

export const getBusinessServices = (
  filters: {
    name?: string[];
    description?: string[];
    owner?: string[];
  },
  pagination: PageQuery,
  sortBy?: BusinessServiceSortByQuery
): AxiosPromise<BusinessServicePage> => {
  let sortByQuery: string | undefined = undefined;
  if (sortBy) {
    let field;
    switch (sortBy.field) {
      case BusinessServiceSortBy.NAME:
        field = "name";
        break;
      case BusinessServiceSortBy.OWNER:
        field = "owner.displayName";
        break;
      default:
        throw new Error("Could not define SortBy field name");
    }
    sortByQuery = `${sortBy.direction === "desc" ? "-" : ""}${field}`;
  }

  const params = {
    page: pagination.page - 1,
    size: pagination.perPage,
    sort: sortByQuery,

    name: filters.name,
    description: filters.description,
    "owner.displayName": filters.owner,
  };

  const query: string[] = buildQuery(params);
  return APIClient.get(`${BUSINESS_SERVICES}?${query.join("&")}`, { headers });
};

export const deleteBusinessService = (id: number | string): AxiosPromise => {
  return APIClient.delete(`${BUSINESS_SERVICES}/${id}`);
};

export const createBusinessService = (
  obj: BusinessService
): AxiosPromise<BusinessService> => {
  return APIClient.post(`${BUSINESS_SERVICES}`, obj);
};

export const updateBusinessService = (
  obj: BusinessService
): AxiosPromise<BusinessService> => {
  return APIClient.put(`${BUSINESS_SERVICES}/${obj.id}`, obj);
};

export const getBusinessServiceById = (
  id: number | string
): AxiosPromise<BusinessService> => {
  return APIClient.get(`${BUSINESS_SERVICES}/${id}`);
};

// Stakeholders

export enum StakeholderSortBy {
  EMAIL,
  DISPLAY_NAME,
  JOB_FUNCTION,
  STAKEHOLDER_GROUPS_COUNT,
}
export interface StakeholderSortByQuery {
  field: StakeholderSortBy;
  direction?: Direction;
}

export const getStakeholders = (
  filters: {
    email?: string[];
    displayName?: string[];
    jobFunction?: string[];
    stakeholderGroup?: string[];
  },
  pagination: PageQuery,
  sortBy?: StakeholderSortByQuery
): AxiosPromise<StakeholderPage> => {
  let sortByQuery: string | undefined = undefined;
  if (sortBy) {
    let field;
    switch (sortBy.field) {
      case StakeholderSortBy.EMAIL:
        field = "email";
        break;
      case StakeholderSortBy.DISPLAY_NAME:
        field = "displayName";
        break;
      case StakeholderSortBy.JOB_FUNCTION:
        field = "jobFunction.role";
        break;
      case StakeholderSortBy.STAKEHOLDER_GROUPS_COUNT:
        field = "stakeholderGroups.size()";
        break;
      default:
        throw new Error("Could not define SortBy field name");
    }
    sortByQuery = `${sortBy.direction === "desc" ? "-" : ""}${field}`;
  }

  const params = {
    page: pagination.page - 1,
    size: pagination.perPage,
    sort: sortByQuery,

    email: filters.email,
    displayName: filters.displayName,
    "jobFunction.role": filters.jobFunction,
    "stakeholderGroups.name": filters.stakeholderGroup,
  };

  const query: string[] = buildQuery(params);
  return APIClient.get(`${STAKEHOLDERS}?${query.join("&")}`, { headers });
};

export const createJobFunction = (
  obj: JobFunction
): AxiosPromise<JobFunction> => {
  return APIClient.post(`${JOB_FUNCTIONS}`, obj);
};

export const updateJobFunction = (
  obj: JobFunction
): AxiosPromise<JobFunction> => {
  return APIClient.put(`${JOB_FUNCTIONS}/${obj.id}`, obj);
};

export const deleteJobFunction = (id: number): AxiosPromise => {
  return APIClient.delete(`${JOB_FUNCTIONS}/${id}`);
};

export const deleteStakeholder = (id: number): AxiosPromise => {
  return APIClient.delete(`${STAKEHOLDERS}/${id}`);
};

export const createStakeholder = (
  obj: Stakeholder
): AxiosPromise<Stakeholder> => {
  return APIClient.post(`${STAKEHOLDERS}`, obj);
};

export const updateStakeholder = (
  obj: Stakeholder
): AxiosPromise<Stakeholder> => {
  return APIClient.put(`${STAKEHOLDERS}/${obj.id}`, obj);
};

// Stakeholder groups

export enum StakeholderGroupSortBy {
  NAME,
  STAKEHOLDERS_COUNT,
}
export interface StakeholderGroupSortByQuery {
  field: StakeholderGroupSortBy;
  direction?: Direction;
}

export const getStakeholderGroups = (
  filters: {
    name?: string[];
    description?: string[];
    stakeholder?: string[];
  },
  pagination: PageQuery,
  sortBy?: StakeholderGroupSortByQuery
): AxiosPromise<StakeholderGroupPage> => {
  let sortByQuery: string | undefined = undefined;
  if (sortBy) {
    let field;
    switch (sortBy.field) {
      case StakeholderGroupSortBy.NAME:
        field = "name";
        break;
      case StakeholderGroupSortBy.STAKEHOLDERS_COUNT:
        field = "stakeholders.size()";
        break;
      default:
        throw new Error("Could not define SortBy field name");
    }
    sortByQuery = `${sortBy.direction === "desc" ? "-" : ""}${field}`;
  }

  const params = {
    page: pagination.page - 1,
    size: pagination.perPage,
    sort: sortByQuery,

    name: filters.name,
    description: filters.description,
    "stakeholders.displayName": filters.stakeholder,
  };

  const query: string[] = buildQuery(params);
  return APIClient.get(`${STAKEHOLDER_GROUPS}?${query.join("&")}`, { headers });
};

export const deleteStakeholderGroup = (id: number): AxiosPromise => {
  return APIClient.delete(`${STAKEHOLDER_GROUPS}/${id}`);
};

export const createStakeholderGroup = (
  obj: StakeholderGroup
): AxiosPromise<StakeholderGroup> => {
  return APIClient.post(`${STAKEHOLDER_GROUPS}`, obj);
};

export const updateStakeholderGroup = (
  obj: StakeholderGroup
): AxiosPromise<StakeholderGroup> => {
  return APIClient.put(`${STAKEHOLDER_GROUPS}/${obj.id}`, obj);
};

// Job functions

export enum JobFunctionSortBy {
  ROLE,
}
export interface JobFunctionSortByQuery {
  field: JobFunctionSortBy;
  direction?: Direction;
}

export const getJobFunctions = (
  filters: {
    role?: string[];
  },
  pagination: PageQuery,
  sortBy?: JobFunctionSortByQuery
): AxiosPromise<JobFunctionPage> => {
  let sortByQuery: string | undefined = undefined;
  if (sortBy) {
    let field;
    switch (sortBy.field) {
      case JobFunctionSortBy.ROLE:
        field = "role";
        break;
      default:
        throw new Error("Could not define SortBy field name");
    }
    sortByQuery = `${sortBy.direction === "desc" ? "-" : ""}${field}`;
  }

  const params = {
    page: pagination.page - 1,
    size: pagination.perPage,
    sort: sortByQuery,

    role: filters.role,
  };

  const query: string[] = buildQuery(params);
  return APIClient.get(`${JOB_FUNCTIONS}?${query.join("&")}`, { headers });
};

// Tag types

export enum TagTypeSortBy {
  NAME,
  RANK,
  COLOR,
  TAGS_COUNT,
}
export interface TagTypeSortByQuery {
  field: TagTypeSortBy;
  direction?: Direction;
}

export const getTagTypes = (
  filters: {
    tagTypes?: string[];
    tags?: string[];
  },
  pagination: PageQuery,
  sortBy?: TagTypeSortByQuery
): AxiosPromise<TagTypePage> => {
  let sortByQuery: string | undefined = undefined;
  if (sortBy) {
    let field;
    switch (sortBy.field) {
      case TagTypeSortBy.NAME:
        field = "name";
        break;
      case TagTypeSortBy.RANK:
        field = "rank";
        break;
      case TagTypeSortBy.COLOR:
        field = "rank";
        break;
      case TagTypeSortBy.TAGS_COUNT:
        field = "tags.size()";
        break;
      default:
        throw new Error("Could not define SortBy field name");
    }
    sortByQuery = `${sortBy.direction === "desc" ? "-" : ""}${field}`;
  }

  const params = {
    page: pagination.page - 1,
    size: pagination.perPage,
    sort: sortByQuery,

    name: filters.tagTypes,
    "tags.name": filters.tags,
  };

  const query: string[] = buildQuery(params);
  return APIClient.get(`${TAG_TYPES}?${query.join("&")}`, { headers });
};

export const deleteTagType = (id: number): AxiosPromise => {
  return APIClient.delete(`${TAG_TYPES}/${id}`);
};

export const createTagType = (obj: TagType): AxiosPromise<TagType> => {
  return APIClient.post(`${TAG_TYPES}`, obj);
};

export const updateTagType = (obj: TagType): AxiosPromise<TagType> => {
  return APIClient.put(`${TAG_TYPES}/${obj.id}`, obj);
};

export const getTagTypeById = (id: number): AxiosPromise<TagType> => {
  return APIClient.get(`${TAG_TYPES}/${id}`);
};

export const deleteTag = (id: number): AxiosPromise => {
  return APIClient.delete(`${TAGS}/${id}`);
};

export const createTag = (obj: Tag): AxiosPromise<Tag> => {
  return APIClient.post(`${TAGS}`, obj);
};

export const updateTag = (obj: Tag): AxiosPromise<Tag> => {
  return APIClient.put(`${TAGS}/${obj.id}`, obj);
};

export const getTagById = (id: number | string): AxiosPromise<Tag> => {
  return APIClient.get(`${TAGS}/${id}`);
};

// App inventory

export enum ApplicationSortBy {
  NAME,
  TAGS,
}
export interface ApplicationSortByQuery {
  field: ApplicationSortBy;
  direction?: Direction;
}

export const getApplications = (
  filters: {
    name?: string[];
    description?: string[];
    businessService?: string[];
    tag?: string[];
  },
  pagination: PageQuery,
  sortBy?: ApplicationSortByQuery
): AxiosPromise<ApplicationPage> => {
  let sortByQuery: string | undefined = undefined;
  if (sortBy) {
    let field;
    switch (sortBy.field) {
      case ApplicationSortBy.NAME:
        field = "name";
        break;
      case ApplicationSortBy.TAGS:
        field = "tags.size()";
        break;
      default:
        throw new Error("Could not define SortBy field name");
    }
    sortByQuery = `${sortBy.direction === "desc" ? "-" : ""}${field}`;
  }

  const params = {
    page: pagination.page - 1,
    size: pagination.perPage,
    sort: sortByQuery,

    name: filters.name,
    description: filters.description,
    businessService: filters.businessService,
    "tags.tag": filters.tag,
  };

  const query: string[] = buildQuery(params);
  return APIClient.get(`${APPLICATIONS}?${query.join("&")}`, {
    headers,
  });
};

export const deleteApplication = (id: number): AxiosPromise => {
  return APIClient.delete(`${APPLICATIONS}/${id}`);
};

export const createApplication = (
  obj: Application
): AxiosPromise<Application> => {
  return APIClient.post(`${APPLICATIONS}`, obj);
};

export const updateApplication = (
  obj: Application
): AxiosPromise<Application> => {
  return APIClient.put(`${APPLICATIONS}/${obj.id}`, obj);
};

export const getApplicationById = (
  id: number | string
): AxiosPromise<Application> => {
  return APIClient.get(`${APPLICATIONS}/${id}`);
};

//

export const getApplicationDependencies = (
  filters: {
    from?: string[];
    to?: string[];
  },
  pagination: PageQuery
): AxiosPromise<ApplicationDependencyPage> => {
  const params = {
    page: pagination.page - 1,
    size: pagination.perPage,

    "from.id": filters.from,
    "to.id": filters.to,
  };

  const query: string[] = buildQuery(params);
  return APIClient.get(`${APPLICATION_DEPENDENCY}?${query.join("&")}`, {
    headers,
  });
};

export const createApplicationDependency = (
  obj: ApplicationDependency
): AxiosPromise<ApplicationDependency> => {
  return APIClient.post(`${APPLICATION_DEPENDENCY}`, obj);
};

export const deleteApplicationDependency = (id: number): AxiosPromise => {
  return APIClient.delete(`${APPLICATION_DEPENDENCY}/${id}`);
};

//

export const getReviewId = (id: number | string): AxiosPromise<Review> => {
  return APIClient.get(`${REVIEW}/${id}`);
};

export const createReview = (obj: Review): AxiosPromise<Review> => {
  return APIClient.post(`${REVIEW}`, obj);
};

export const updateReview = (obj: Review): AxiosPromise<Review> => {
  return APIClient.put(`${REVIEW}/${obj.id}`, obj);
};

export const deleteReview = (id: number): AxiosPromise => {
  return APIClient.delete(`${REVIEW}/${id}`);
};

//

export const getAssessments = (filters: {
  applicationId?: number | string;
}): AxiosPromise<Assessment[]> => {
  const params = {
    applicationId: filters.applicationId,
  };

  const query: string[] = buildQuery(params);
  return APIClient.get(`${ASSESSMENTS}?${query.join("&")}`);
};

export const createAssessment = (obj: Assessment): AxiosPromise<Assessment> => {
  return APIClient.post(`${ASSESSMENTS}`, obj);
};

export const patchAssessment = (obj: Assessment): AxiosPromise<Assessment> => {
  return APIClient.patch(`${ASSESSMENTS}/${obj.id}`, obj);
};

export const getAssessmentById = (
  id: number | string
): AxiosPromise<Assessment> => {
  return APIClient.get(`${ASSESSMENTS}/${id}`);
};

export const deleteAssessment = (id: number): AxiosPromise => {
  return APIClient.delete(`${ASSESSMENTS}/${id}`);
};

export const getLandscape = (
  applicationIds: number[]
): AxiosPromise<AssessmentRisk[]> => {
  return APIClient.get(
    `${ASSESSMENTS}?${applicationIds
      .map((f) => `applicationId=${f}`)
      .join("&")}`
  );
};
