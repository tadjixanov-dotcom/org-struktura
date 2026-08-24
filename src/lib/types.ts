export type Project = {
  id: string;
  slug: string;
  name: string;
  companyName: string | null;
  description: string | null;
  logoUrl: string | null;
  accent: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  nodeCount?: number;
};

export type OrgNode = {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  personName: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  summary: string | null;
  duties: string[];
  responsibilities: string[];
  authorities: string[];
  kpis: string[];
  requirements: string[];
  accent: string | null;
  x: number;
  y: number;
  sortOrder: number;
};

export type OrgTreeNode = OrgNode & { children: OrgTreeNode[]; depth: number };

export const EMPTY_NODE: Omit<OrgNode, "id" | "projectId"> = {
  parentId: null,
  title: "",
  personName: null,
  department: null,
  email: null,
  phone: null,
  photoUrl: null,
  summary: null,
  duties: [],
  responsibilities: [],
  authorities: [],
  kpis: [],
  requirements: [],
  accent: null,
  x: 0,
  y: 0,
  sortOrder: 0,
};
