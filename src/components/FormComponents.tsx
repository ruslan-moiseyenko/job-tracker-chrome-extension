// Enhanced form components similar to dashboard functionality
import React, { useState, useRef, useEffect } from "react";
import styled from "@emotion/styled";
import { COLORS, SHADOWS } from "../constants/colors";
import { useDebounce } from "../hooks/useDebounce";

// Company Autocomplete Component (similar to InputCompanyAutocomplete.tsx)
interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  location?: string;
}

interface CompanyAutocompleteProps {
  companies: Company[];
  loading: boolean;
  onSearch: (query: string) => void;
  onSelect: (company: Company | null) => void;
  onInputChange?: (inputValue: string) => void;
  selectedCompany: Company | null;
  inputValue?: string;
  placeholder?: string;
}

const AutocompleteContainer = styled.div`
  position: relative;
  width: 100%;
`;

const AutocompleteInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid ${COLORS.FORM_BORDER};
  border-radius: 8px;
  font-size: 14px;
  background: ${COLORS.BACKGROUND_PRIMARY};
  color: ${COLORS.TEXT_PRIMARY};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${COLORS.FORM_FOCUS_BLUE};
    box-shadow: ${SHADOWS.INPUT_FOCUS_BLUE};
    background: ${COLORS.BACKGROUND_PRIMARY};
  }

  &:disabled {
    background: ${COLORS.FORM_DISABLED_BG};
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${COLORS.GRAY_400};
  }
`;

const SuggestionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: ${COLORS.BACKGROUND_PRIMARY};
  border: 1px solid ${COLORS.FORM_BORDER};
  border-radius: 8px;
  box-shadow: ${SHADOWS.DROPDOWN};
  max-height: 200px;
  overflow-y: auto;
  margin: 4px 0 0 0;
  padding: 0;
  list-style: none;
`;

const SuggestionItem = styled.li<{ isHighlighted?: boolean }>`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid ${COLORS.FORM_SEPARATOR};
  background: ${props =>
    props.isHighlighted ? COLORS.FORM_DISABLED_BG : COLORS.WHITE};

  &:hover {
    background: ${COLORS.FORM_DISABLED_BG};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CompanyName = styled.div`
  font-weight: 500;
  color: ${COLORS.TEXT_DARK};
`;

const CompanyDetails = styled.div`
  font-size: 12px;
  color: ${COLORS.TEXT_MUTED};
`;

const LoadingIndicator = styled.div`
  padding: 12px;
  text-align: center;
  color: ${COLORS.TEXT_MUTED};
  font-size: 14px;
`;

export function CompanyAutocomplete({
  companies,
  loading,
  onSearch,
  onSelect,
  onInputChange,
  selectedCompany,
  inputValue: externalInputValue,
  placeholder = "Search companies..."
}: CompanyAutocompleteProps) {
  const [inputValue, setInputValue] = useState(externalInputValue || selectedCompany?.name || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const debouncedSearchTerm = useDebounce(inputValue, 300);

  // Update internal state when external inputValue changes
  useEffect(() => {
    if (externalInputValue !== undefined) {
      setInputValue(externalInputValue);
    }
  }, [externalInputValue]);

  useEffect(() => {
    if (selectedCompany && !externalInputValue) {
      setInputValue(selectedCompany.name);
    }
  }, [selectedCompany, externalInputValue]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);

    // Clear selection if user types something different
    if (selectedCompany && value !== selectedCompany.name) {
      onSelect(null);
    }

    // Notify parent of input change
    onInputChange?.(value);
  };

  const handleSuggestionClick = (company: Company) => {
    setInputValue(company.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    onSelect(company);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || companies.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < companies.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : companies.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(companies[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Delay hiding to allow for click events
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <AutocompleteContainer>
      <AutocompleteInput
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
      />

      {showSuggestions && (companies.length > 0 || loading) && (
        <SuggestionsList>
          {loading ? (
            <LoadingIndicator>Searching companies...</LoadingIndicator>
          ) : (
            companies.map((company, index) => (
              <SuggestionItem
                key={company.id}
                ref={el => {
                  suggestionRefs.current[index] = el;
                }}
                isHighlighted={index === highlightedIndex}
                onClick={() => handleSuggestionClick(company)}
              >
                <CompanyInfo>
                  <CompanyName>{company.name}</CompanyName>
                  {(company.industry || company.location) && (
                    <CompanyDetails>
                      {[company.industry, company.location]
                        .filter(Boolean)
                        .join(" • ")}
                    </CompanyDetails>
                  )}
                </CompanyInfo>
              </SuggestionItem>
            ))
          )}
        </SuggestionsList>
      )}
    </AutocompleteContainer>
  );
}

// Stage Select Component (similar to CurrentStageSelectCell.tsx)
interface Stage {
  id: string;
  name: string;
  color?: string;
  isDefault: boolean;
}

interface StageSelectProps {
  stages: Stage[];
  selectedStageId?: string;
  onSelect: (stageId: string) => void;
  loading?: boolean;
  placeholder?: string;
}

const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid ${COLORS.FORM_BORDER};
  border-radius: 8px;
  font-size: 14px;
  background: ${COLORS.BACKGROUND_PRIMARY};
  color: ${COLORS.TEXT_PRIMARY};
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${COLORS.FORM_FOCUS_BLUE};
    box-shadow: ${SHADOWS.INPUT_FOCUS_BLUE};
    background: ${COLORS.BACKGROUND_PRIMARY};
  }

  &:disabled {
    background: ${COLORS.FORM_DISABLED_BG};
    cursor: not-allowed;
  }
`;

const StageOption = styled.option`
  padding: 8px;
  background: ${COLORS.BACKGROUND_PRIMARY};
  color: ${COLORS.TEXT_PRIMARY};
`;

export function StageSelect({
  stages,
  selectedStageId,
  onSelect,
  loading = false,
  placeholder = "Select stage..."
}: StageSelectProps) {
  return (
    <SelectContainer>
      <SelectInput
        value={selectedStageId || ""}
        onChange={e => onSelect(e.target.value)}
        disabled={loading || stages.length === 0}
      >
        <StageOption value="">{placeholder}</StageOption>
        {stages.map(stage => (
          <StageOption key={stage.id} value={stage.id}>
            {stage.name}
          </StageOption>
        ))}
      </SelectInput>
    </SelectContainer>
  );
}
