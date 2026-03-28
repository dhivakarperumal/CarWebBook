import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  getDocs,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { db } from "../../firebase";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";

const auth = getAuth();

/* ---------------- CONSTANTS ---------------- */

const roles = [
  "Service Manager",
  "Mechanic",
  "Senior Mechanic",
  "Electrician",
  "Denter",
  "Painter",
  "Car Washer",
  "Receptionist",
  "Accountant",
];

const departments = [
  "Mechanical",
  "Electrical",
  "Body Shop",
  "Paint Booth",
  "Washing",
  "Front Office",
  "Accounts",
];

const shifts = [
  "Morning (9 AM - 6 PM)",
  "General (10 AM - 7 PM)",
  "Evening (12 PM - 9 PM)",
];

const genders = ["Male", "Female", "Other"];

const inputClass =
  "w-full px-4 py-3 rounded-lg bg-white text-gray-800 border shadow focus:ring-2 focus:ring-blue-500";

/* ---------------- COMPONENT ---------------- */

const AddEditStaff = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    employeeId: "",
    role: "",
    department: "",
    skills: "",
    shift: "",
    salary: "",
    gender: "",
    dob: "",
    joiningDate: "",
    timeIn: "",
    timeOut: "",
    address: "",
    status: "active",
    photo: "",
    aadharDoc: "",
    idDoc: "",
    certificateDoc: "",
  });

  /* ---------------- EMPLOYEE ID ---------------- */

  const generateEmployeeId = async () => {
    const ref = doc(db, "counters", "employees");
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const next = (snap.exists() ? snap.data().current : 0) + 1;
      tx.set(ref, { current: next }, { merge: true });
      return `EMP${String(next).padStart(3, "0")}`;
    });
  };

  /* ---------------- LOAD EDIT ---------------- */

  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "employees", id));
      if (!snap.exists()) return toast.error("Employee not found");

      setForm((p) => ({ ...p, ...snap.data(), password: "" }));

      const docsSnap = await getDocs(collection(db, "employees", id, "documents"));
      docsSnap.forEach((d) => {
        setForm((p) => ({ ...p, [`${d.data().type}Doc`]: d.data().file }));
      });
    };
    load();
  }, [id, isEdit]);

  /* ---------------- HANDLERS ---------------- */

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      setForm((p) => ({ ...p, email: value, username: value.split("@")[0] }));
    } else if (name === "phone") {
      setForm((p) => ({ ...p, phone: value, password: value }));
    } else if (name === "timeIn") {
      setForm((p) => ({
        ...p,
        timeIn: value,
        timeOut: p.timeOut && p.timeOut <= value ? "" : p.timeOut,
      }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  /* ---------------- FILE UPLOAD ---------------- */

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (file.type.startsWith("image/")) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 800,
        });
        const base64 = await imageCompression.getDataUrlFromFile(compressed);
        setForm((p) => ({ ...p, [field]: base64 }));
      } else {
        const reader = new FileReader();
        reader.onload = () =>
          setForm((p) => ({ ...p, [field]: reader.result }));
        reader.readAsDataURL(file);
      }
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  /* ---------------- VALIDATION ---------------- */

  const validate = () => {
    const e = {};
    if (!form.name) e.name = "Required";
    if (!form.email) e.email = "Required";
    if (!isEdit && form.password.length < 6) e.password = "Min 6 chars";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Invalid phone";
    if (!form.role) e.role = "Required";
    if (!form.department) e.department = "Required";
    if (!form.shift) e.shift = "Required";
    if (!form.salary || isNaN(form.salary)) e.salary = "Invalid salary";
    if (!form.gender) e.gender = "Required";
    if (!form.dob) e.dob = "Required";
    if (!form.joiningDate) e.joiningDate = "Required";
    if (!form.timeIn) e.timeIn = "Required";
    if (!form.timeOut) e.timeOut = "Required";
    if (form.timeOut <= form.timeIn) e.timeOut = "Must be after Time In";
    if (!form.address) e.address = "Required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return toast.error("Fix errors");

    setLoading(true);
    try {
      let data = { ...form };

      if (!isEdit) {
        data.employeeId = await generateEmployeeId();
        const cred = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        data.authUid = cred.user.uid;
      }

      const { photo, aadharDoc, idDoc, certificateDoc, password, ...final } =
        data;

      let ref;
      if (isEdit) {
        ref = doc(db, "employees", id);
        await updateDoc(ref, { ...final, updatedAt: serverTimestamp() });
      } else {
        ref = await addDoc(collection(db, "employees"), {
          ...final,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const saveDoc = (type, file) =>
        file &&
        addDoc(collection(ref, "documents"), {
          type,
          file,
          createdAt: serverTimestamp(),
        });

      await Promise.all([
        saveDoc("photo", photo),
        saveDoc("aadhar", aadharDoc),
        saveDoc("id", idDoc),
        saveDoc("certificate", certificateDoc),
      ]);

      toast.success(isEdit ? "Updated" : "Added");
      navigate("/admin/employees");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  const Error = ({ e }) => e && <p className="text-xs text-red-500">{e}</p>;

  const labelClass = "text-sm font-semibold text-gray-800 mb-1";
  const inputClass = "w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition";

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-6">
        {isEdit ? "Edit Employee" : "Add Employee"}
      </h2>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">

        {/* Name */}
        <div>
          <label className={labelClass}>Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter full name"
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter email"
            className={inputClass}
          />
        </div>

        {/* Phone */}
        <div>
          <label className={labelClass}>Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            className={inputClass}
          />
        </div>

        {/* Password (view only) */}
        {!isEdit && (
          <div>
            <label className={labelClass}>Generated Password</label>
            <input
              value={form.password}
              disabled
              className={`${inputClass} bg-gray-100`}
            />
          </div>
        )}

        {/* Role */}
        <div>
          <label className={labelClass}>Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label className={labelClass}>Department</label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Skills */}
        <div>
          <label className={labelClass}>Skills</label>
          <input
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="Engine, AC, etc"
            className={inputClass}
          />
        </div>

        {/* Shift */}
        <div>
          <label className={labelClass}>Shift</label>
          <select
            name="shift"
            value={form.shift}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select shift</option>
            {shifts.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Salary */}
        <div>
          <label className={labelClass}>Salary</label>
          <input
            name="salary"
            value={form.salary}
            onChange={handleChange}
            placeholder="Enter salary"
            className={inputClass}
          />
        </div>

        {/* Gender */}
        <div>
          <label className={labelClass}>Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select gender</option>
            {genders.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div>
          <label className={labelClass}>Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Joining Date</label>
          <input
            type="date"
            name="joiningDate"
            value={form.joiningDate}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Time */}
        <div>
          <label className={labelClass}>Time In</label>
          <input
            type="time"
            name="timeIn"
            value={form.timeIn}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Time Out</label>
          <input
            type="time"
            name="timeOut"
            value={form.timeOut}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className={labelClass}>Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Enter address"
            className={`${inputClass} min-h-[100px]`}
          />
        </div>

        {/* Documents */}
        <div>
          <label className={labelClass}>Photo</label>
          <input type="file" className={inputClass} onChange={(e) => handleFileUpload(e, "photo")} />
        </div>

        <div>
          <label className={labelClass}>Aadhar Document</label>
          <input type="file" className={inputClass} onChange={(e) => handleFileUpload(e, "aadharDoc")} />
        </div>

        <div>
          <label className={labelClass}>ID Proof</label>
          <input type="file" className={inputClass} onChange={(e) => handleFileUpload(e, "idDoc")} />
        </div>

        <div>
          <label className={labelClass}>Certificate</label>
          <input type="file" className={inputClass} onChange={(e) => handleFileUpload(e, "certificateDoc")} />
        </div>

        {/* Submit */}
        <div className="flex w-full justify-end">
          <button
            className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-500 transition"
          >
            {loading ? "Saving..." : "Save Employee"}
          </button>
        </div>


      </form>
    </div>

  );
};

export default AddEditStaff;
