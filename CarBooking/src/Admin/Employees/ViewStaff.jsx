import { useEffect, useState } from "react";
import api from "../../api";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaArrowLeft
} from "react-icons/fa";

const ViewStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/staff/${id}`);
        const data = res.data;
        // Map backend snake_case to frontend camelCase if needed
        setStaff({
          ...data,
          employeeId: data.employee_id,
          bloodGroup: data.blood_group,
          joiningDate: data.joining_date,
          emergencyName: data.emergency_name,
          emergencyPhone: data.emergency_phone,
          timeIn: data.time_in,
          timeOut: data.time_out,
          aadharDoc: data.aadhar_doc,
          idDoc: data.id_doc,
          certificateDoc: data.certificate_doc
        });
      } catch (err) {
        console.error("Error loading staff:", err);
      }
    };

    load();
  }, [id]);

  if (!staff) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Loading staff details...
      </div>
    );
  }

  return (
    <div className="min-h-screen   px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-white bg-blue-600 mb-8 rounded-full px-3 py-2 hover:underline flex items-center gap-1"
        >
          <FaArrowLeft /> Back
        </button>

      </div>
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">




        <div className="grid grid-cols-1 lg:grid-cols-3">

          {/* LEFT PANEL */}
          <div className="p-6 bg-white/80 backdrop-blur-lg border-r border-gray-200 space-y-6">

            <h3 className="text-lg font-semibold text-gray-800">
              Staff Profile
            </h3>

            <div className="flex justify-center">
              {staff.photo ? (
                <div className="h-40 w-40 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-600 shadow-lg">
                  <img
                    src={staff.photo}
                    alt="Staff"
                    className="h-full w-full rounded-full object-cover border-4 border-white"
                  />
                </div>
              ) : (
                <div className="h-40 w-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                  No Photo
                </div>
              )}
            </div>

            {/* BASIC INFO */}
            <div className="space-y-3">
              <Info label="Employee ID" value={staff.employeeId} />
              <Info label="Username" value={staff.username} />

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${staff.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                    }`}
                >
                  {staff.status}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
<div className="lg:col-span-2 p-6 space-y-8">

  {/* PROFILE + WORK INFO */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    {/* LEFT COLUMN – PROFILE INFO */}
    <div className="bg-white border border-gray-200 rounded-xl p-5 border-l-4 ">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Profile Information
      </h3>

      <div className="space-y-3">
        <Info label="Name" value={staff.name} />
        <Info label="Email" value={staff.email} />
        <Info label="Phone" value={staff.phone} />
        <Info label="Gender" value={staff.gender} />
        <Info label="Blood Group" value={staff.bloodGroup} />
        <Info label="Date of Birth" value={staff.dob} />
      </div>
    </div>

    {/* RIGHT COLUMN – WORK DETAILS */}
    <div className="bg-white border border-gray-200 rounded-xl p-5 border-l-4">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Work Details
      </h3>

      <div className="space-y-3">
        <Info label="Role" value={staff.role} />
        <Info label="Department" value={staff.department} />
        <Info label="Shift" value={staff.shift} />
        <Info label="Shift Timing" value={`${staff.timeIn || "--:--"} to ${staff.timeOut || "--:--"}`} />
        <Info label="Salary" value={staff.salary} />
        <Info label="Experience" value={staff.experience} />
        <Info label="Joining Date" value={staff.joiningDate} />
      </div>
    </div>

  </div>

  {/* ADDRESS – FULL WIDTH */}
  <div className="bg-white border border-gray-200 rounded-xl p-5 border-l-4 ">
    <h3 className="text-base font-semibold text-gray-800 mb-2">
      Address
    </h3>
    <p className="text-gray-700 leading-relaxed">
      {staff.address || "-"}
    </p>
  </div>

  {/* EMERGENCY CONTACT */}
  <TitleSection title="Emergency Contact" accent="red">
    <Info label="Name" value={staff.emergencyName} />
    <Info label="Phone" value={staff.emergencyPhone} />
  </TitleSection>

  {/* DOCUMENTS */}
  <TitleSection title="Documents" accent="blue">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {staff.aadharDoc && (
        <DocumentCard label="Aadhar" src={staff.aadharDoc} />
      )}
      {staff.idDoc && (
        <DocumentCard label="ID Proof" src={staff.idDoc} />
      )}
      {staff.certificateDoc && (
        <DocumentCard label="Certificate" src={staff.certificateDoc} />
      )}
      {!staff.aadharDoc && !staff.idDoc && !staff.certificateDoc && (
        <p className="text-sm text-gray-400">No documents uploaded</p>
      )}
    </div>
  </TitleSection>




          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- SMALL UI COMPONENTS ---------- */

const TitleSection = ({ title, children, accent }) => {
  const accentColor = {
    blue: "border-l-blue-500",
    green: "border-l-green-500",
    purple: "border-l-purple-500",
    red: "border-l-red-500",
  };

  return (
    <div
      className={`bg-gradient-to-br from-white to-gray-50 
      rounded-xl border border-gray-200 shadow-sm p-6
      border-l-4 ${accentColor[accent] || "border-l-gray-300"}`}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-5">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
};

const DocumentCard = ({ label, src }) => (
  <div className="group border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
    {src.startsWith("data:image") ? (
      <img
        src={src}
        alt={label}
        className="h-28 w-full object-cover group-hover:scale-105 transition"
      />
    ) : (
      <div className="h-28 w-full flex items-center justify-center bg-gray-100 text-gray-400">
        📄 PDF/Doc
      </div>
    )}
    <p className="text-xs py-2 text-center bg-gray-50 capitalize text-gray-600">
      {label}
    </p>
  </div>
);

const Info = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium text-gray-800">{value || "-"}</p>
  </div>
);

export default ViewStaff;

