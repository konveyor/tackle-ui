export interface PageQuery {
  page: number;
  perPage: number;
}

export interface SortByQuery {
  index: number;
  direction: "asc" | "desc";
}

export interface PageRepresentation<T> {
  meta: Meta;
  data: T[];
}

export interface Meta {
  count: number;
}

// Controls

export interface BusinessService {
  id?: number;
  name: string;
  description?: string;
  owner?: Stakeholder;
}

export interface Stakeholder {
  id?: number;
  displayName: string;
  email: string;
  jobFunction?: JobFunction;
  stakeholderGroups?: StakeholderGroup[];
}

export interface StakeholderGroup {
  id?: number;
  name: string;
  description: string;
  stakeholders?: Stakeholder[];
}

export interface JobFunction {
  id?: number;
  role: string;
}

export interface TagType {
  id?: number;
  name: string;
  rank?: number;
  colour?: string;
  tags?: Tag[];
}

export interface Tag {
  id?: number;
  name: string;
  tagType?: TagType;
}

// Application inventory

export interface Application {
  id?: number;
  name: string;
  description?: string;
  comments?: string;
  businessService?: string;
  tags?: string[];
}

export interface ApplicationDependency {
  id?: number;
  from: Application;
  to: Application;
}

// Pathfinder

export interface Assessment {
  id?: number;
  applicationId: number;
  status: "EMPTY" | "STARTED" | "COMPLETE";
  stakeholders?: number[];
  stakeholderGroups?: number[];
}

// Pagination

export interface BusinessServicePage {
  _embedded: {
    "business-service": BusinessService[];
  };
  total_count: number;
}

export interface StakeholderPage {
  _embedded: {
    stakeholder: Stakeholder[];
  };
  total_count: number;
}

export interface StakeholderGroupPage {
  _embedded: {
    "stakeholder-group": StakeholderGroup[];
  };
  total_count: number;
}

export interface JobFunctionPage {
  _embedded: {
    "job-function": JobFunction[];
  };
  total_count: number;
}

export interface TagPage {
  _embedded: {
    tag: Tag[];
  };
  total_count: number;
}

export interface TagTypePage {
  _embedded: {
    "tag-type": TagType[];
  };
  total_count: number;
}

export interface TagTypePage {
  _embedded: {
    "tag-type": TagType[];
  };
  total_count: number;
}

export interface ApplicationPage {
  _embedded: {
    application: Application[];
  };
  total_count: number;
}

export interface ApplicationDependencyPage {
  _embedded: {
    "applications-dependency": ApplicationDependency[];
  };
  total_count: number;
}
