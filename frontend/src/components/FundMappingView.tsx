import React, { useState, useEffect } from "react";
import {
  getUnmappedHoldings,
  getRawResearchFunds,
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
  Search
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
  const [searchQuery, setSearchQuery] = useState("");

  const selectOptions = researchFunds.map((rf) => ({
    value: rf.id,
    label: rf.name,
  }));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [unmappedRes, fundsRes] = await Promise.all([
        getUnmappedHoldings(),
        getRawResearchFunds(),
      ]);
      
      const unmappedData = unmappedRes.data;
      
      const initMappings: { [key: string]: string } = {};
      const initSuccess: { [key: string]: boolean } = {};
      unmappedData.forEach((u: any) => {
        if (u.fundId) {
          initMappings[u.fundNameRaw] = u.fundId;
          initSuccess[u.fundNameRaw] = true;
        }
      });

      setUnmapped(unmappedData);
      setResearchFunds(fundsRes.data);
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
      
      // Update unmapped array so it knows this is now mapped
      setUnmapped(prev => prev.map(u => u.fundNameRaw === fundNameRaw ? { ...u, fundId: researchFundId } : u));
    } catch (error) {
      console.error(error);
      alert("Failed to map fund");
    } finally {
      setSaving({ ...saving, [fundNameRaw]: false });
    }
  };

  // 1. Filter by search query
  let processedData = unmapped.filter(u => 
    searchQuery === "" || u.fundNameRaw.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Sort unmapped funds to the top
  processedData.sort((a, b) => {
    const isMappedA = !!a.fundId;
    const isMappedB = !!b.fundId;
    
    // If one is mapped and the other isn't, unmapped comes first
    if (!isMappedA && isMappedB) return -1;
    if (isMappedA && !isMappedB) return 1;
    
    // Secondary sort: highest count comes first
    return (b.count || 0) - (a.count || 0);
  });

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <GitMerge className="text-blue-600" /> Fund Mapping Dictionary
        </h2>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search scheme name..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value); 
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <p className="text-gray-600 mb-6 text-sm">
        This is the master dictionary of every unique mutual fund found across
        all uploaded client portfolios. Unmapped funds appear at the top. Ensure every scheme is mapped to a
        Research Fund to calculate quartiles and trigger the appropriate alerts.
      </p>

      {loading ? (
        <p className="text-gray-500 text-center py-10">
          Loading portfolio schemes...
        </p>
      ) : processedData.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <p className="text-gray-800 font-semibold">No schemes found!</p>
          <p className="text-xs text-gray-500">
            {unmapped.length > 0 ? "No schemes match your search." : "Upload a client portfolio to begin mapping."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="overflow-auto h-[calc(100vh-280px)] border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-100 border-y border-gray-200">
                  <th className="bg-gray-100 py-1.5 px-2 font-semibold text-gray-600 text-xs">
                    Scheme Name (from Portfolio)
                  </th>
                  <th className="bg-gray-100 py-1.5 px-2 font-semibold text-gray-600 text-xs text-center">
                    Holdings
                  </th>
                  <th className="bg-gray-100 py-1.5 px-2 font-semibold text-gray-600 text-xs">
                    AI Suggestion
                  </th>
                  <th className="bg-gray-100 py-1.5 px-2 font-semibold text-gray-600 text-xs">
                    Map to Research Fund
                  </th>
                  <th className="bg-gray-100 py-1.5 px-2 font-semibold text-gray-600 text-xs text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-[12px] bg-white divide-y divide-gray-100">
                {currentData.map((item) => (
                  <tr
                    key={item.fundNameRaw}
                    className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${success[item.fundNameRaw] ? "bg-green-50/20" : ""}`}
                  >
                    <td className="py-1.5 px-2 text-gray-900 font-bold whitespace-nowrap min-w-[200px]" title={item.fundNameRaw}>
                      {item.fundNameRaw}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">
                        {item.count}
                      </span>
                    </td>
                    <td className="py-1.5 px-2">
                      {item.suggestedFundName ? (
                        <div className="flex items-center gap-2 text-purple-700 text-[11px] bg-purple-50 px-2 py-1.5 rounded-md border border-purple-100 whitespace-nowrap w-max">
                          <Sparkles size={14} className="shrink-0" />
                          <span className="font-medium" title={item.suggestedFundName}>{item.suggestedFundName}</span>
                          <div className="flex items-center gap-1.5 ml-2">
                            <span className="font-bold text-[9px] bg-purple-200 px-1.5 py-0.5 rounded">{item.confidenceScore}%</span>
                            <button
                              onClick={() => {
                                if (item.suggestedFundId) {
                                  setMappings({
                                    ...mappings,
                                    [item.fundNameRaw]: item.suggestedFundId,
                                  });
                                }
                              }}
                              className="text-purple-600 hover:text-purple-900 hover:bg-purple-200 p-1 rounded transition-colors"
                              title="Use Suggestion"
                            >
                              <Zap size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2" style={{ minWidth: "300px" }}>
                      <Select
                        options={selectOptions}
                        value={
                          mappings[item.fundNameRaw]
                            ? selectOptions.find(
                                (o) => o.value === mappings[item.fundNameRaw],
                              )
                            : null
                        }
                        onChange={(selected) => {
                          setMappings({
                            ...mappings,
                            [item.fundNameRaw]: selected?.value || "",
                          });
                          // Reset success state if they change the mapping
                          setSuccess({
                            ...success,
                            [item.fundNameRaw]: false,
                          });
                        }}
                        placeholder="Search Research Fund..."
                        isSearchable
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        menuPlacement="auto"
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          control: (base) => ({
                            ...base,
                            minHeight: '28px',
                            height: '28px',
                            fontSize: '11px'
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            height: '28px',
                            padding: '0 6px'
                          }),
                          input: (base) => ({
                            ...base,
                            margin: '0px',
                          }),
                          indicatorSeparator: base => ({
                            display: 'none',
                          }),
                          indicatorsContainer: (base) => ({
                            ...base,
                            height: '28px',
                          }),
                          menu: (base) => ({
                            ...base,
                            fontSize: '11px'
                          })
                        }}
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <button
                        onClick={() => handleMap(item.fundNameRaw)}
                        disabled={
                          !mappings[item.fundNameRaw] ||
                          saving[item.fundNameRaw]
                        }
                        className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 mx-auto transition-colors ${
                          success[item.fundNameRaw]
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : mappings[item.fundNameRaw]
                              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {saving[item.fundNameRaw] ? (
                          "Saving..."
                        ) : success[item.fundNameRaw] ? (
                          <>
                            <CheckCircle size={14} /> Mapped
                          </>
                        ) : (
                          <>
                            <Link size={14} /> Map
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(num) => {
              setItemsPerPage(num);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
