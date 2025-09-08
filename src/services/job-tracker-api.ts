// Job Tracker API Service - Easy-to-use wrapper for your GraphQL operations
import {
  JobApplicationService,
  type User,
  type Company,
  type ApplicationStage,
  type JobSearchType,
  type JobApplicationType,
  type CreateJobApplicationInput,
  type UpdateJobApplicationInput,
  type JobSearchFilterInput
} from "../utils/job-application-service";

/**
 * Main API service for Job Tracker Chrome Extension
 * Provides simplified methods for all GraphQL operations
 */
export class JobTrackerAPI {
  // User operations
  static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await JobApplicationService.getMe();
      return response.success && response.data ? response.data.me : null;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  }

  // Company operations
  static async searchCompanies(name: string): Promise<Company[]> {
    try {
      const response = await JobApplicationService.searchCompanies(name);
      return response.success && response.data
        ? response.data.searchCompanies
        : [];
    } catch (error) {
      console.error("Failed to search companies:", error);
      return [];
    }
  }

  // Application stages
  static async getApplicationStages(): Promise<ApplicationStage[]> {
    try {
      console.log("🔍 Fetching application stages...");
      const response = await JobApplicationService.getAllStages();
      console.log("📋 Stages response:", response);

      if (response.success && response.data?.getAllStages) {
        console.log("✅ Stages loaded:", response.data.getAllStages);
        return response.data.getAllStages;
      } else {
        console.warn("⚠️ No stages in response:", response);
        return [];
      }
    } catch (error) {
      console.error("❌ Failed to get application stages:", error);
      return [];
    }
  }

  // Job search operations
  static async getLastJobSearch(): Promise<string | null> {
    try {
      const response = await JobApplicationService.getLastActiveSearch();
      return response.success && response.data
        ? response.data.getLastActiveSearch
        : null;
    } catch (error) {
      console.error("Failed to get last job search:", error);
      return null;
    }
  }

  // Alternative method: Get jobSearchId from user's lastActiveSearchId
  static async getJobSearchIdFromUser(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (user?.lastActiveSearchId) {
        console.log(
          "📝 Using lastActiveSearchId from user:",
          user.lastActiveSearchId
        );
        return user.lastActiveSearchId;
      }
      console.warn("⚠️ No lastActiveSearchId found in user data");
      return null;
    } catch (error) {
      console.error("Failed to get jobSearchId from user:", error);
      return null;
    }
  }

  // Job application operations
  static async createJobApplication(
    applicationData: CreateJobApplicationInput
  ): Promise<JobApplicationType | null> {
    try {
      console.log("🚀 Creating job application with data:", applicationData);
      const response = await JobApplicationService.createApplication(
        applicationData
      );
      console.log("📝 Create application response:", response);

      if (response.success && response.data?.createJobApplication) {
        console.log(
          "✅ Job application created successfully:",
          response.data.createJobApplication
        );
        return response.data.createJobApplication;
      } else {
        console.error("❌ Failed to create application - Response:", response);
        if (response.error) {
          console.error("🔴 Backend error details:", response.error);
        }
        return null;
      }
    } catch (error) {
      console.error("💥 Exception creating job application:", error);
      return null;
    }
  }

  static async updateJobApplication(
    id: string,
    updateData: UpdateJobApplicationInput
  ): Promise<JobApplicationType | null> {
    try {
      const response = await JobApplicationService.updateApplication(
        id,
        updateData
      );
      return response.success && response.data
        ? response.data.updateJobApplication
        : null;
    } catch (error) {
      console.error("Failed to update job application:", error);
      return null;
    }
  }

  static async getJobApplications(
    limit = 20,
    offset = 0
  ): Promise<JobApplicationType[]> {
    try {
      const response = await JobApplicationService.getApplications(
        limit,
        offset
      );
      return response.success && response.data
        ? response.data.jobApplications
        : [];
    } catch (error) {
      console.error("Failed to get job applications:", error);
      return [];
    }
  }

  // Utility methods
  static async refreshAllData(): Promise<void> {
    try {
      await JobApplicationService.refreshAll();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }

  // Quick form submit method for the floating form (handles legacy format)
  static async submitQuickApplication(formData: {
    name?: string;
    surname?: string;
    position: string;
    company: string;
    notes?: string;
    stageId?: string;
    jobLinks?: string[];
    salary?: number | string;
  }): Promise<JobApplicationType | null> {
    try {
      // First, get the current job search ID
      const jobSearchId = await this.getLastJobSearch();
      if (!jobSearchId) {
        throw new Error(
          "No active job search found. Please create a job search first."
        );
      }

      // Convert legacy format to new GraphQL schema format
      const applicationInput: CreateJobApplicationInput = {
        positionTitle: formData.position.trim(),
        currentStageId: formData.stageId || "",
        company: {
          newCompany: {
            name: formData.company.trim()
          }
        },
        jobLinks: formData.jobLinks?.map(link => link.trim()) || [
          window.location.href
        ],
        jobSearchId,
        jobDescription:
          formData.notes?.trim() ||
          (formData.name && formData.surname
            ? `Applicant: ${formData.name?.trim()} ${formData.surname?.trim()}`
            : undefined),
        salary: formData.salary
          ? typeof formData.salary === "number"
            ? formData.salary
            : parseFloat(formData.salary)
          : undefined
      };

      return this.createJobApplication(applicationInput);
    } catch (error) {
      console.error("Failed to submit quick application:", error);
      return null;
    }
  }

  // Legacy method to support existing FloatingForm component
  static async createLegacyApplication(legacyData: {
    name: string;
    surname: string;
    position: string;
    company: string;
  }): Promise<JobApplicationType | null> {
    return this.submitQuickApplication(legacyData);
  }

  // Batch operations
  static async updateMultipleApplications(
    updates: Array<{ id: string; updateData: UpdateJobApplicationInput }>
  ): Promise<{ successful: number; failed: number }> {
    try {
      const response = await JobApplicationService.updateMultipleApplications(
        updates
      );

      if (response.success && response.data) {
        return {
          successful: response.data.updated,
          failed: response.data.failed
        };
      }

      return { successful: 0, failed: updates.length };
    } catch (error) {
      console.error("Failed to update multiple applications:", error);
      return { successful: 0, failed: updates.length };
    }
  }
}

// Export types for convenience
export type {
  User,
  Company,
  ApplicationStage,
  JobSearchType,
  JobApplicationType,
  CreateJobApplicationInput,
  UpdateJobApplicationInput,
  JobSearchFilterInput
};
