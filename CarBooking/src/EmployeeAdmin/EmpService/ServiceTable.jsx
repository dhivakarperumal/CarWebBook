import React from "react";
import { FaEdit, FaEye, FaFileInvoice, FaWrench, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const STATUS_STEPS = [
  "Approved",
  "Processing",
  "Waiting for Spare",
  "Service Going on",
  "Bill Pending",
  "Bill Completed",
  "Service Completed",
];

const ServiceTable = ({ 
  data, 
  currentPage, 
  itemsPerPage, 
  onUpdateStatus, 
  onOpenIssueModal, 
  onOpenCloseModal, 
  getMappedStatus, 
  getStatusColor, 
  getSpareStatus,
  getElapsedTime,
  getHoursDifference,
  pathPrefix
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-2xl shadow-blue-900/5 border border-gray-100 animate-fadeIn overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[1200px]">
          <thead className="text-white">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">S No</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Identifier</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Customer Profile</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Issues</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Spare Status</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90 text-center">Workflow</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-90 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 border border-gray-100 text-gray-300">
                      <FaWrench size={24} />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No active service protocols found for criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6"><span className="text-xs font-black text-gray-400">{(currentPage - 1) * itemsPerPage + index + 1}</span></td>
                  <td className="px-8 py-6"><span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block leading-none mb-1">#ID {item.id}</span><span className="text-xs font-black text-blue-900">{item.bookingId || "SER-NEW"}</span></td>
                  <td className="px-8 py-6"><p className="text-sm font-black text-gray-900">{item.name}</p><p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{item.phone}</p></td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3 group/issue">
                      <p className="text-xs font-bold text-gray-600 truncate max-w-[150px]" title={item.issue || item.otherIssue || item.carIssue || "Routine Checkup"}>
                        {item.issue || item.otherIssue || item.carIssue || "Routine Checkup"}
                      </p>
                      <button 
                        onClick={() => onOpenIssueModal(item)}
                        className="p-1.5 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 transition-all shadow-sm border border-amber-200/50"
                        title="Edit Diagnostics"
                      >
                        <FaEdit size={10} />
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {(() => {
                      const ss = getSpareStatus(item.parts);
                      return <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${ss.color}`}>{ss.label}</span>;
                    })()}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <select 
                      value={getMappedStatus(item.serviceStatus || item.status)}
                      onChange={(e) => onUpdateStatus(item.id, e.target.value)}
                      className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase border inline-block min-w-[150px] text-center cursor-pointer outline-none focus:ring-4 focus:ring-black/5 ${getStatusColor(item.serviceStatus || item.status)}`}
                    >
                      {STATUS_STEPS.map((step, idx) => {
                        const currentIdx = STATUS_STEPS.findIndex(s => s.toLowerCase() === (item.serviceStatus || item.status || "Booked").toLowerCase()) || 0;
                        if (idx < currentIdx) return null;
                        return (
                          <option key={step} value={step} className="bg-white text-black font-bold uppercase">{step}</option>
                        );
                      })}
                    </select>
                  </td>
                  <td className="px-8 py-6 text-left">
                    <div className="flex justify-end gap-2">
                      {getMappedStatus(item.serviceStatus || item.status) === "Waiting for Spare" && (
                        <button 
                          onClick={() => onOpenCloseModal(item)} 
                          className="h-10 px-4 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center leading-tight group/btn"
                        >
                          <span className={getHoursDifference(item.updatedAt || item.updated_at) >= 72 ? "text-red-700 group-hover/btn:text-white" : ""}>
                            {getHoursDifference(item.updatedAt || item.updated_at) >= 72 ? "Time Out" : "No Response"}
                          </span>
                          <span className="text-[7px] font-bold opacity-60 group-hover/btn:opacity-100">{getElapsedTime(item.updatedAt || item.updated_at)}</span>
                        </button>
                      )}
                      
                      <button onClick={() => onOpenIssueModal(item)} className="h-10 px-4 bg-gray-900 text-gray-400 hover:bg-amber-50 hover:text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all" title="Edit Log & Parts"><FaEdit /></button>
                      {getMappedStatus(item.serviceStatus || item.status) === "Bill Pending" && (
                        <button onClick={() => navigate(`${pathPrefix}/addbillings`, { state: { service: item } })} className="h-10 px-4 bg-black text-white hover:bg-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2" title="Generate Bill"><FaFileInvoice /> Bill</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceTable;
