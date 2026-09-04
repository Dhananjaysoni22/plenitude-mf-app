import React, { useState, useEffect } from "react";
import {
  getUnmappedHoldings,
  getResearchFunds,
  mapFund,
} from "../api/data.api";
import Select from "react-select";
import {
  CheckCircle,
  AlertCircle,
  GitMerge,
  Link,
  Sparkles,
  Zap,
} from "lucide-react";
import Pagination from "./Pagination";

export default function FundMappingView() {
  const [unmapped, setUnmapped] = useState<any[]>([]);
  const [researchFunds, setResearchFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [success, setSuccess] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const selectOptions = researchFunds.map((rf) => ({
    value: rf.id,
    label: rf.name,
  }));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [unmappedRes, fundsRes] = await Promise.all([
        getUnmappedHoldings(),
        getResearchFunds(),
      ]);
      setUnmapped(unmappedRes.data);
      setResearchFunds(fundsRes.data);

      const initMappings: { [key: string]: string } = {};
      const initSuccess: { [key: string]: boolean } = {};
      unmappedRes.data.forEach((u: any) => {
        if (u.fundId) {
          initMappings[u.fundNameRaw] = u.fundId;
          initSuccess[u.fundNameRaw] = true;
        }
      });
      setMappings(initMappings);
      setSuccess(initSuccess);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMap = async (fundNameRaw: string) => {
    const researchFundId = mappings[fundNameRaw];
    if (!researchFundId) return;

    try {
      setSaving({ ...saving, [fundNameRaw]: true });
      await mapFund({ fundNameRaw: fundNameRaw, researchFundId });
      setSuccess({ ...success, [fundNameRaw]: true });
    } catch (error) {
      console.error(error);
      alert("Failed to map fund");
    } finally {
      setSaving({ ...saving, [fundNameRaw]: false });
    }
  };

  const totalPages = Math.ceil(unmapped.length / itemsPerPage);
  const currentData = unmapped.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <GitMerge className="text-blue-600" /> Fund Mapping Dictionary
        </h2>
      </div>

      <p className="text-gray-600 mb-6">
        This is the master dictionary of every unique mutual fund found across
        all uploaded client portfolios. Ensure every scheme is mapped to a
        Research Fund to calculate quartiles and trigger the appropriate alerts.
      </p>

      {loading ? (
        <p className="text-gray-500 text-center py-10">
          Loading portfolio schemes...
        </p>
      ) : unmapped.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <p className="text-gray-800 font-semibold">No schemes found!</p>
          <p className="text-sm text-gray-500">
            Upload a client portfolio to begin mapping.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="overflow-auto h-[calc(100vh-280px)]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-100 border-y border-gray-200">
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    Scheme Name (from Portfolio)
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-center">
                    Holdings
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    AI Suggestion
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    Map to Research Fund
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item) => (
                  <tr
                    key={item.fundNameRaw}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {item.fundNameRaw}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                        {item.count}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.suggestedFundName ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                            <Sparkles size={12} /> {item.confidenceScore}% Match
                          </span>
                          <span className="text-sm text-gray-600 font-medium leading-tight">
                            {item.suggestedFundName}
                          </span>
                          <button
                            onClick={() =>
                              setMappings({
                                ...mappings,
                                [item.fundNameRaw]: item.suggestedFundId,
                              })
                            }
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold mt-1 text-left flex items-center gap-1 w-fit"
                          >
                            <Zap size={12} /> Auto-Fill
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          No suggestion
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Select
                        className="w-full text-sm min-w-[250px]"
                        options={selectOptions}
                        value={
                          selectOptions.find(
                            (opt) => opt.value === mappings[item.fundNameRaw],
                          ) || null
                        }
                        onChange={(selectedOption: any) =>
                          setMappings({
                            ...mappings,
                            [item.fundNameRaw]: selectedOption
                              ? selectedOption.value
                              : "",
                          })
                        }
                        isDisabled={success[item.fundNameRaw]}
                        placeholder="Search Research Fund..."
                        isClearable
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {success[item.fundNameRaw] ? (
                        <button
                          onClick={() => setSuccess({ ...success, [item.fundNameRaw]: false })}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1.5 px-4 rounded transition-colors text-sm whitespace-nowrap shadow-sm border border-gray-300"
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMap(item.fundNameRaw)}
                          disabled={
                            !mappings[item.fundNameRaw] ||
                            saving[item.fundNameRaw]
                          }
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-1.5 px-4 rounded transition-colors text-sm whitespace-nowrap shadow-sm"
                        >
                          {saving[item.fundNameRaw] ? "Saving..." : "Approve"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={unmapped.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
