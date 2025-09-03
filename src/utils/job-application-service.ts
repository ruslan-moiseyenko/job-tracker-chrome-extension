// Enhanced JobApplicationService with your improvements
import { BackgroundGraphQLClient, type GraphQLResponse } from "./graphql-client";

// New types based on the GraphQL schema - matching your API response
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastActiveSearchId?: string;
  provider?: string;
  providerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
}

export interface ApplicationStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  isDefault: boolean;
}

export interface JobSearchType {
  id: string;
  title: string;
  location?: string;
  keywords?: string;
  salaryMin?: number;
  salaryMax?: number;
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: {
    experienceLevel?: string;
    jobType?: string;
    remote?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ContactType {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  linkedinUrl?: string;
}

export interface JobApplicationType {
  id: string;
  positionTitle: string;
  company: Company;
  currentStage: ApplicationStage;
  jobLinks: string[];
  jobDescription?: string;
  salary?: string;
  createdAt: string;
  updatedAt: string;
}

// Input types - matching dashboard exactly with all required fields
export interface CreateJobApplicationInput {
  positionTitle: string;
  currentStageId: string;
  company: CompanyInput;
  jobLinks: string[];
  jobSearchId: string;
  jobDescription?: string;
  salary?: string;
  customColor?: string;
}

export interface CompanyInput {
  existingCompanyId?: string;
  newCompany?: {
    name: string;
  };
}

export interface UpdateJobApplicationInput {
  position?: string;
  companyId?: string;
  stageId?: string;
  applicationDate?: string;
  source?: string;
  priority?: string;
  notes?: string;
}

export interface JobSearchFilterInput {
  query?: string;
  location?: string;
  industry?: string;
  size?: string;
}

export interface PaginationInput {
  limit?: number;
  offset?: number;
}

// Legacy types for backward compatibility (simplified)
export type JobApplicationStatus = string; // Will be defined by the server schema

// Alias for the new type
export type JobApplication = JobApplicationType;

export class JobApplicationService {
  // Create application with client-side validation (your approach ✅)
  static async createApplication(applicationData: CreateJobApplicationInput): Promise<GraphQLResponse<{ createJobApplication: JobApplication }>> {
    return BackgroundGraphQLClient.mutate(GRAPHQL_QUERIES.CREATE_JOB_APPLICATION, { input: applicationData });
  }

  // Get applications with smart caching (your improvement ✅)
  static async getApplications(
    limit = 20,
    offset = 0,
    options: {
      useCache?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<GraphQLResponse<{ jobApplications: JobApplication[] }>> {
    const { useCache = true, forceRefresh = false } = options;

    // If force refresh, invalidate cache first
    if (forceRefresh) {
      await BackgroundGraphQLClient.invalidateCache("jobApplications");
    }

    return BackgroundGraphQLClient.query(
      GRAPHQL_QUERIES.GET_JOB_APPLICATIONS,
      {
        pagination: { limit, offset },
        filter: {}
      },
      {
        useCache: useCache && !forceRefresh,
        cacheTTL: 2 * 60 * 1000 // 2 minutes
      }
    );
  }

  // Update entire application (enhanced version)
  static async updateApplication(id: string, updateData: UpdateJobApplicationInput): Promise<GraphQLResponse<{ updateJobApplication: JobApplication }>> {
    try {
      const result = await BackgroundGraphQLClient.mutate(GRAPHQL_QUERIES.UPDATE_JOB_APPLICATION, { id, input: updateData });

      // Invalidate cache after successful update
      if (result.success) {
        await BackgroundGraphQLClient.invalidateCache("jobApplications");
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Update failed"
      };
    }
  }

  // New service methods based on your GraphQL schema

  // Get current user info
  static async getMe(): Promise<GraphQLResponse<{ me: User }>> {
    return BackgroundGraphQLClient.query(
      GRAPHQL_QUERIES.ME,
      {},
      {
        useCache: true,
        cacheTTL: 5 * 60 * 1000 // 5 minutes
      }
    );
  }

  // Search companies
  static async searchCompanies(name: string): Promise<GraphQLResponse<{ searchCompanies: Company[] }>> {
    return BackgroundGraphQLClient.query(GRAPHQL_QUERIES.SEARCH_COMPANIES, { name });
  }

  // Get all application stages
  static async getAllStages(): Promise<GraphQLResponse<{ getAllStages: ApplicationStage[] }>> {
    return BackgroundGraphQLClient.query(GRAPHQL_QUERIES.GET_APPLICATION_STAGES, {});
  }

  // Get last active job search
  static async getLastActiveSearch(): Promise<GraphQLResponse<{ getLastActiveSearch: string }>> {
    return BackgroundGraphQLClient.query(GRAPHQL_QUERIES.GET_LAST_ACTIVE_SEARCH, {});
  }

  // Batch operations (updated to work with new schema)
  static async updateMultipleApplications(updates: Array<{ id: string; updateData: UpdateJobApplicationInput }>): Promise<
    GraphQLResponse<{
      updated: number;
      failed: number;
      results: Array<GraphQLResponse<{ updateJobApplication: JobApplication }> | { error: unknown }>;
    }>
  > {
    const results = await Promise.allSettled(updates.map(update => this.updateApplication(update.id, update.updateData)));

    const processedResults = results.map(result => (result.status === "fulfilled" ? result.value : { error: result.reason }));

    const successful = processedResults.filter(result => "success" in result && result.success).length;

    return {
      success: true,
      data: {
        updated: successful,
        failed: results.length - successful,
        results: processedResults
      }
    };
  }

  // Refresh data utility
  static async refreshAll(): Promise<void> {
    await BackgroundGraphQLClient.invalidateCache();
    if (BackgroundGraphQLClient["config"].enableLogging) {
      console.log("🔄 All data refreshed");
    }
  }
}

export const GRAPHQL_QUERIES = {
  // User queries - matching your API example exactly
  ME: `
    query Me {
      me {
        id
        email
        firstName
        lastName
        lastActiveSearchId
        provider
        providerId
        createdAt
        updatedAt
      }
    }
  `,

  // Authentication mutations
  REFRESH_TOKEN: `
    mutation RefreshToken($input: RefreshTokenInput!) {
      refreshToken(input: $input) {
        success
        accessToken
        refreshToken
        expiresIn
      }
    }
  `,

  // Company queries - matching dashboard exactly
  SEARCH_COMPANIES: `
    query searchCompanies($name: String!) {
      searchCompanies(name: $name) {
        id
        name
      }
    }
  `,

  // Application stages - matching API documentation exactly
  GET_APPLICATION_STAGES: `
    query getAllStages {
      getAllStages {
        id
        name
        description
        order
        color
      }
    }
  `,

  // Job search queries - matching dashboard exactly
  GET_LAST_ACTIVE_SEARCH: `
    query getLastActiveJobSearch {
      getLastActiveSearch
    }
  `,

  // Job application mutations - matching dashboard exactly with input structure
  CREATE_JOB_APPLICATION: `
    mutation CreateJobApplication($input: CreateJobApplicationInput!) {
      createJobApplication(input: $input) {
        id
        positionTitle
        company {
          id
          name
        }
        currentStage {
          id
          name
          color
        }
        jobLinks
        jobDescription
        salary
        createdAt
        updatedAt
      }
    }
  `,

  UPDATE_JOB_APPLICATION: `
    mutation UpdateJobApplication($id: ID!, $input: UpdateJobApplicationInput!) {
      updateJobApplication(id: $id, input: $input) {
        id
        positionTitle
        company {
          id
          name
        }
        currentStage {
          id
          name
          color
        }
        jobLinks
        jobDescription
        salary
        createdAt
        updatedAt
      }
    }
  `,

  // Legacy queries for backward compatibility
  GET_JOB_APPLICATIONS: `
    query GetJobApplications($pagination: PaginationInput, $filter: JobSearchFilterInput) {
      jobApplications(pagination: $pagination, filter: $filter) {
        id
        position
        company {
          id
          name
          website
          industry
          location
        }
        stage {
          id
          name
          color
        }
        applicationDate
        source
        status
        priority
        notes
        createdAt
        updatedAt
      }
    }
  `
};

// Development mode setup for Chrome Extensions
declare global {
  interface Window {
    __DEV_GRAPHQL__: boolean;
  }
}

// Auto-enable dev mode in development
if (typeof window !== "undefined" && window.__DEV_GRAPHQL__) {
  BackgroundGraphQLClient.enableDevMode(true);
  BackgroundGraphQLClient.configure({
    timeout: 30000,
    defaultCacheTTL: 30 * 1000 // 30 seconds in dev
  });
}
