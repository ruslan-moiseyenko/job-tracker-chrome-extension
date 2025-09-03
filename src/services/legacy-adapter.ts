// Legacy adapter to support existing FloatingForm component
import { JobTrackerAPI } from "./job-tracker-api";
import type { GraphQLResponse } from "../utils/graphql-client";

// Legacy interface for backward compatibility with FloatingForm
export interface LegacyJobApplicationInput {
  name: string;
  surname: string;
  position: string;
  company: string;
}

// Legacy JobApplicationService methods that the FloatingForm expects
export class LegacyJobApplicationService {
  static async createApplication(legacyData: LegacyJobApplicationInput): Promise<GraphQLResponse<{ createJobApplication: unknown }>> {
    try {
      // Use the new API to create the application
      const result = await JobTrackerAPI.submitQuickApplication({
        name: legacyData.name,
        surname: legacyData.surname,
        position: legacyData.position,
        company: legacyData.company,
        notes: `Applicant: ${legacyData.name} ${legacyData.surname}`
      });

      if (result) {
        return {
          success: true,
          data: { createJobApplication: result }
        };
      } else {
        return {
          success: false,
          error: "Failed to create job application"
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  // Proxy other methods to the main service if needed
  static async refreshAll(): Promise<void> {
    return JobTrackerAPI.refreshAllData();
  }
}

export { LegacyJobApplicationService as JobApplicationService };
