// Enhanced hooks for company search with caching (similar to dashboard)
import { useState, useEffect, useCallback, useMemo } from "react";
import { JobTrackerAPI, type Company } from "../services/job-tracker-api";

interface UseCachedCompanySearchReturn {
  companies: Company[];
  loading: boolean;
  error: string | null;
  searchCompanies: (query: string) => Promise<void>;
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  clearSearch: () => void;
}

/**
 * Hook for company search with caching - similar to dashboard useCachedCompanySearch
 */
export function useCachedCompanySearch(): UseCachedCompanySearchReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const searchCompanies = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCompanies([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await JobTrackerAPI.searchCompanies(searchTerm);
      setCompanies(results);
    } catch (error) {
      console.error("Error searching companies:", error);
      setError(error instanceof Error ? error.message : "Failed to search companies");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setCompanies([]);
    setSelectedCompany(null);
    setError(null);
  }, []);

  return {
    companies,
    loading,
    error,
    searchCompanies,
    selectedCompany,
    setSelectedCompany,
    clearSearch
  };
}

// Hook for getting application stages
interface UseGetStagesReturn {
  stages: Array<{
    id: string;
    name: string;
    description?: string;
    order: number;
    color?: string;
    isDefault: boolean;
  }>;
  loading: boolean;
  error: string | null;
  defaultStage: { id: string; name: string } | null;
}

export function useGetStages(): UseGetStagesReturn {
  const [stages, setStages] = useState<UseGetStagesReturn["stages"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStages = async () => {
      try {
        console.log("🔍 useGetStages: Starting to fetch stages...");
        const result = await JobTrackerAPI.getApplicationStages();
        console.log("📋 useGetStages: Raw result from API:", result);
        setStages(result);
        setError(null);
        console.log("✅ useGetStages: Stages set successfully, count:", result.length);
      } catch (err) {
        console.error("❌ useGetStages: Error fetching stages:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch stages");
        setStages([]);
      } finally {
        setLoading(false);
        console.log("🏁 useGetStages: Fetch completed");
      }
    };

    fetchStages();
  }, []);

  const defaultStage = useMemo(() => {
    const defaultStageItem = stages.find(stage => stage.isDefault);
    return defaultStageItem ? { id: defaultStageItem.id, name: defaultStageItem.name } : null;
  }, [stages]);

  return {
    stages,
    loading,
    error,
    defaultStage
  };
}

// Hook for creating job application - matching dashboard structure exactly
interface CreateJobApplicationData {
  positionTitle: string;
  currentStageId: string;
  company: {
    existingCompanyId?: string;
    newCompany?: {
      name: string;
    };
  };
  jobLinks: string[];
  jobSearchId: string;
  jobDescription?: string;
  salary?: number;
  customColor?: string;
}

interface UseCreateJobApplicationReturn {
  createApplication: (data: CreateJobApplicationData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useCreateJobApplication(): UseCreateJobApplicationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createApplication = useCallback(async (data: CreateJobApplicationData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await JobTrackerAPI.createJobApplication(data);
      return !!result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createApplication,
    loading,
    error
  };
}
