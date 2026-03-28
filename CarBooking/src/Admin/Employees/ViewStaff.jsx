import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
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
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "staff", id));
      if (snap.exists()) {
        setStaff(snap.data());
      }

      const docsSnap = await getDocs(collection(db, "staff", id, "documents"));
      setDocuments(docsSnap.docs.map((d) => d.data()));
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

            {/* PROFILE PHOTO */}
            <div className="flex justify-center">
              {documents.filter(d => d.type === "photo").length > 0 ? (
                documents
                  .filter(d => d.type === "photo")
                  .map((doc, i) => (
                    <div
                      key={i}
                      className="h-40 w-40 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-600 shadow-lg"
                    >
                      <img
                        src={doc.file}
                        alt="Staff"
                        className="h-full w-full rounded-full object-cover border-4 border-white"
                      />
                    </div>
                  ))
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
  <div title="Emergency Contact" accent="red">
    <Info label="Name" value={staff.emergencyName} />
    <Info label="Phone" value={staff.emergencyPhone} />
  </div>

  {/* DOCUMENTS */}
  <div title="Documents" accent="blue">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {documents.map((doc, i) => (
        <div
          key={i}
          className="group border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
        >
          <img
            src={doc.file}
            alt={doc.type}
            className="h-28 w-full object-cover group-hover:scale-105 transition"
          />
          <p className="text-xs py-2 text-center bg-gray-50 capitalize text-gray-600">
            {doc.type}
          </p>
        </div>
      ))}

      {documents.length === 0 && (
        <p className="text-sm text-gray-400">
          No documents uploaded
        </p>
      )}
    </div>
  </div>




          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- SMALL UI COMPONENTS ---------- */

const div = ({ title, children, accent }) => {
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

const Info = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium text-gray-800">{value || "-"}</p>
  </div>
);

export default ViewStaff;

