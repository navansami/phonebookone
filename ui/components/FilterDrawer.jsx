import { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, Save, SlidersHorizontal, Trash2, X } from 'lucide-react';

const EMPTY_FILTERS = {
  tags: [],
  languages: [],
  departments: [],
  companies: [],
  designations: [],
  statuses: {
    ert: false,
    ifa: false,
    thirdParty: false,
  },
};

const FILTER_PRESETS = [
  {
    id: 'ert_only',
    label: 'ERT Only',
    filters: {
      ...EMPTY_FILTERS,
      statuses: { ...EMPTY_FILTERS.statuses, ert: true },
    },
  },
  {
    id: 'ifa_only',
    label: 'IFA Only',
    filters: {
      ...EMPTY_FILTERS,
      statuses: { ...EMPTY_FILTERS.statuses, ifa: true },
    },
  },
  {
    id: 'third_party_only',
    label: 'Third Party',
    filters: {
      ...EMPTY_FILTERS,
      statuses: { ...EMPTY_FILTERS.statuses, thirdParty: true },
    },
  },
  {
    id: 'front_office',
    label: 'Front Office',
    filters: {
      ...EMPTY_FILTERS,
      departments: ['Front Office'],
    },
  },
];

const CUSTOM_PRESETS_STORAGE_KEY = 'phonebook_custom_filter_presets';

const chipBaseClass =
  'px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200';

const FilterChip = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`${chipBaseClass} ${
      selected
        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-[#23b7f2] dark:to-[#139fe3] text-white dark:text-[#051018] border-transparent shadow-md'
        : 'bg-gray-100 dark:bg-[#171d24] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-[#29556e] hover:bg-gray-200 dark:hover:bg-[#1f252d]'
    }`}
  >
    {label}
  </button>
);

const sectionTitleClass =
  'text-sm font-semibold text-gray-700 dark:text-[#dbe4ec] mb-3';

const areFiltersEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const FilterSection = ({ title, options, selectedValues, onToggle }) => {
  if (!options?.length) return null;

  return (
    <div>
      <h3 className={sectionTitleClass}>{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option}
            label={option}
            selected={selectedValues.includes(option)}
            onClick={() => onToggle(option)}
          />
        ))}
      </div>
    </div>
  );
};

const StatusToggle = ({ label, checked, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
      checked
        ? 'border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-[#23b7f2] dark:to-[#139fe3] text-white dark:text-[#051018] shadow-md'
        : 'border-gray-200 dark:border-[#29556e] bg-gray-50 dark:bg-[#171d24] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1f252d]'
    }`}
  >
    <span className="font-medium">{label}</span>
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
        checked
          ? 'border-white/70 dark:border-[#051018]/30 bg-white/20 dark:bg-[#051018]/10'
          : 'border-gray-300 dark:border-[#3a4b59]'
      }`}
    >
      {checked && <Check className="h-3.5 w-3.5" />}
    </span>
  </button>
);

const FilterDrawer = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onClearAll,
  options,
}) => {
  const [draftFilters, setDraftFilters] = useState(filters);
  const [customPresets, setCustomPresets] = useState([]);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraftFilters(filters);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [filters, isOpen]);

  useEffect(() => {
    const storedPresets = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    if (!storedPresets) return;

    try {
      const parsed = JSON.parse(storedPresets);
      if (Array.isArray(parsed)) {
        setCustomPresets(parsed);
      }
    } catch {
      setCustomPresets([]);
    }
  }, []);

  const activeCount = useMemo(() => {
    return (
      draftFilters.tags.length +
      draftFilters.languages.length +
      draftFilters.departments.length +
      draftFilters.companies.length +
      draftFilters.designations.length +
      Object.values(draftFilters.statuses).filter(Boolean).length
    );
  }, [draftFilters]);

  if (!isOpen) return null;

  const toggleValue = (key, value) => {
    setDraftFilters((prev) => {
      const values = prev[key];
      return {
        ...prev,
        [key]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  };

  const toggleStatus = (key) => {
    setDraftFilters((prev) => ({
      ...prev,
      statuses: {
        ...prev.statuses,
        [key]: !prev.statuses[key],
      },
    }));
  };

  const handleApply = () => {
    onApply(draftFilters);
    onClose();
  };

  const handleReset = () => {
    setDraftFilters(EMPTY_FILTERS);
  };

  const handleClearAll = () => {
    setDraftFilters(EMPTY_FILTERS);
    onClearAll();
  };

  const handleApplyPreset = (presetFilters) => {
    setDraftFilters(presetFilters);
  };

  const persistCustomPresets = (nextPresets) => {
    setCustomPresets(nextPresets);
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(nextPresets));
  };

  const handleSavePreset = () => {
    const trimmedName = presetName.trim();
    if (!trimmedName) return;

    const nextPreset = {
      id: `custom_${Date.now()}`,
      label: trimmedName,
      filters: draftFilters,
    };

    const filteredPresets = customPresets.filter(
      (preset) => preset.label.toLowerCase() !== trimmedName.toLowerCase()
    );

    persistCustomPresets([nextPreset, ...filteredPresets]);
    setPresetName('');
  };

  const handleDeletePreset = (presetId) => {
    persistCustomPresets(customPresets.filter((preset) => preset.id !== presetId));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-gray-200 bg-white px-5 py-5 shadow-2xl dark:border-[#1b212a] dark:bg-[#0b0f14]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2 dark:bg-[#102431]">
              <SlidersHorizontal className="h-5 w-5 text-indigo-600 dark:text-[#23b7f2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeCount} active {activeCount === 1 ? 'filter' : 'filters'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#171d24]"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className={sectionTitleClass}>Quick Presets</h3>
            <div className="flex flex-wrap gap-2">
              {FILTER_PRESETS.map((preset) => (
                <FilterChip
                  key={preset.id}
                  label={preset.label}
                  selected={areFiltersEqual(draftFilters, preset.filters)}
                  onClick={() => handleApplyPreset(preset.filters)}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className={sectionTitleClass}>Saved Presets</h3>
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSavePreset();
                  }
                }}
                placeholder="Save current filters as..."
                className="input flex-1"
              />
              <button
                type="button"
                onClick={handleSavePreset}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
                disabled={!presetName.trim()}
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>

            {customPresets.length > 0 ? (
              <div className="space-y-2">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 dark:border-[#29556e] dark:bg-[#171d24]"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset.filters)}
                      className={`flex-1 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                        areFiltersEqual(draftFilters, preset.filters)
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white dark:from-[#23b7f2] dark:to-[#139fe3] dark:text-[#051018]'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#1f252d]'
                      }`}
                    >
                      {preset.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id)}
                      className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500 dark:text-gray-400 dark:hover:bg-[#1f252d] dark:hover:text-red-400"
                      aria-label={`Delete preset ${preset.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Save your current filters for one-click reuse.
              </p>
            )}
          </div>

          <div>
            <h3 className={sectionTitleClass}>Status</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatusToggle label="ERT" checked={draftFilters.statuses.ert} onClick={() => toggleStatus('ert')} />
              <StatusToggle label="IFA" checked={draftFilters.statuses.ifa} onClick={() => toggleStatus('ifa')} />
              <StatusToggle
                label="Third Party"
                checked={draftFilters.statuses.thirdParty}
                onClick={() => toggleStatus('thirdParty')}
              />
            </div>
          </div>

          <FilterSection
            title="Departments"
            options={options.departments}
            selectedValues={draftFilters.departments}
            onToggle={(value) => toggleValue('departments', value)}
          />

          <FilterSection
            title="Companies"
            options={options.companies}
            selectedValues={draftFilters.companies}
            onToggle={(value) => toggleValue('companies', value)}
          />

          <FilterSection
            title="Designations"
            options={options.designations}
            selectedValues={draftFilters.designations}
            onToggle={(value) => toggleValue('designations', value)}
          />

          <FilterSection
            title="Tags"
            options={options.tags}
            selectedValues={draftFilters.tags}
            onToggle={(value) => toggleValue('tags', value)}
          />

          <FilterSection
            title="Languages"
            options={options.languages}
            selectedValues={draftFilters.languages}
            onToggle={(value) => toggleValue('languages', value)}
          />
        </div>

        <div className="sticky bottom-0 mt-6 border-t border-gray-200 bg-white pt-4 dark:border-[#1b212a] dark:bg-[#0b0f14]">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={handleReset} className="btn-secondary flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button type="button" onClick={handleClearAll} className="btn-secondary">
              Clear All
            </button>
            <button type="button" onClick={handleApply} className="btn-primary flex-1">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
