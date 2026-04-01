import { useState, useEffect } from "react";
import { 
  Bike, 
  Car,
  MapPin, 
  IndianRupee, 
  FileText, 
  Image as ImageIcon, 
  User, 
  Settings,
  ChevronRight,
  ChevronLeft,
  Save,
  Trash2,
  Plus
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import imageCompression from "browser-image-compression";

const AddBike = ({ defaultType = "Bike" }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (id) {
       fetchBike();
    } else {
       setForm(prev => ({ ...prev, type: defaultType }));
    }
  }, [id, defaultType]);

  const fetchBike = async () => {
    try {
      const res = await api.get(`/bikes/${id}`);
      const data = res.data;
      setForm({
        ...data,
        type: data.type || "Bike",
        images: typeof data.images === 'string' ? JSON.parse(data.images) : data.images
      });
    } catch (err) {
      toast.error("Failed to load bike details");
    }
  };

  const [form, setForm] = useState({
    title: "",
    brand: "",
    model: "",
    variant: "",
    yom: "",
    reg_year: "",
    engine_cc: "",
    mileage: "",
    fuel_type: "Petrol",
    transmission: "Manual",
    km_driven: "",
    owners: "1",
    color: "",
    city: "",
    area: "",
    pincode: "",
    expected_price: "",
    negotiable: false,
    insurance_valid: "",
    road_tax_paid: false,
    rc_available: false,
    insurance_available: false,
    puc_available: false,
    loan_status: "Clear",
    images: {
      front: "",
      back: "",
      side: "",
      dashboard: "",
      rc: ""
    },
    description: "",
    seller_name: "",
    seller_phone: "",
    seller_email: "",
    status: "draft",
    type: defaultType
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        setForm(prev => ({
          ...prev,
          images: { ...prev.images, [type]: reader.result }
        }));
      };
    } catch (error) {
      toast.error("Image upload failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (Number(form.expected_price) < 5000) {
      toast.error("Price cannot be less than 5000");
      setLoading(false);
      return;
    }

    try {
      const payload = { 
        ...form,
        images: JSON.stringify(form.images)
      };
      
      if (id) {
        await api.put(`/bikes/${id}`, payload);
        toast.success("Bike updated successfully");
      } else {
        await api.post("/bikes", payload);
        toast.success("Bike listed successfully");
      }
      navigate("/admin/bikes");
    } catch (error) {
      toast.error("Failed to save bike");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: "Basic Details", icon: Bike },
    { id: 2, name: "Technical Specs", icon: Settings },
    { id: 3, name: "Location & Price", icon: MapPin },
    { id: 4, name: "Legal & Documents", icon: FileText },
    { id: 5, name: "Images & Seller", icon: User },
  ];

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-black text-gray-900 border-b pb-4">1. Basic {form.type} Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 grid grid-cols-2 gap-4 mb-2">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, type: "Car" }))}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest ${
                    form.type === "Car" 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105" 
                      : "bg-white border-gray-100 text-gray-400 hover:border-blue-200"
                  }`}
                >
                  <Plus className={form.type === "Car" ? "text-white" : "text-gray-300"} size={20} />
                  Car
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, type: "Bike" }))}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest ${
                    form.type === "Bike" 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105" 
                      : "bg-white border-gray-100 text-gray-400 hover:border-blue-200"
                  }`}
                >
                  <Bike className={form.type === "Bike" ? "text-white" : "text-gray-300"} size={20} />
                  Bike
                </button>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">{form.type} Title</label>
                <input 
                  type="text" 
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder={`e.g. ${form.type === 'Bike' ? 'Yamaha R15 V4 2022' : 'Toyota Camry SE 2021'}`}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Brand</label>
                <select 
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                >
                  <option value="">Select Brand</option>
                  <option value="Yamaha">Yamaha</option>
                  <option value="Honda">Honda</option>
                  <option value="Royal Enfield">Royal Enfield</option>
                  <option value="TVS">TVS</option>
                  <option value="Bajaj">Bajaj</option>
                  <option value="Suzuki">Suzuki</option>
                  <option value="KTM">KTM</option>
                  <option value="Kawasaki">Kawasaki</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Tata">Tata</option>
                  <option value="Mahindra">Mahindra</option>
                  <option value="Maruti Suzuki">Maruti Suzuki</option>
                  <option value="Kia">Kia</option>
                  <option value="MG">MG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Model</label>
                <input 
                  type="text" 
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="e.g. R15 V4"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Variant</label>
                <input 
                  type="text" 
                  name="variant"
                  value={form.variant}
                  onChange={handleChange}
                  placeholder="e.g. Racing Blue"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Manufacture Year</label>
                <input 
                  type="number" 
                  name="yom"
                  value={form.yom}
                  onChange={handleChange}
                  placeholder="e.g. 2022"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-black text-gray-900 border-b pb-4">2. {form.type} Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Engine CC</label>
                <input 
                  type="number" 
                  name="engine_cc"
                  value={form.engine_cc}
                  onChange={handleChange}
                  placeholder="e.g. 155"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Mileage (km/l)</label>
                <input 
                  type="number" 
                  name="mileage"
                  value={form.mileage}
                  onChange={handleChange}
                  placeholder="e.g. 45"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Fuel Type</label>
                <select 
                  name="fuel_type"
                  value={form.fuel_type}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">KM Driven</label>
                <input 
                  type="number" 
                  name="km_driven"
                  value={form.km_driven}
                  onChange={handleChange}
                  placeholder="e.g. 12000"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Owners</label>
                <input 
                  type="number" 
                  name="owners"
                  value={form.owners}
                  onChange={handleChange}
                  placeholder="e.g. 1"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Color</label>
                <input 
                  type="text" 
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="e.g. Metallic Black"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-black text-gray-900 border-b pb-4">3. Location & Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">City</label>
                <input 
                  type="text" 
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Chennai"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Pincode</label>
                <input 
                  type="text" 
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 600001"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Expected Price</label>
                <input 
                  type="number" 
                  name="expected_price"
                  value={form.expected_price}
                  onChange={handleChange}
                  placeholder="e.g. 145000"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div className="flex items-center gap-2 mt-10">
                <input 
                  type="checkbox" 
                  name="negotiable"
                  checked={form.negotiable}
                  onChange={handleChange}
                  className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 bg-gray-100 border-gray-300"
                />
                <label className="text-sm font-black text-gray-700 uppercase tracking-widest">Price Negotiable</label>
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Listing Status</label>
                <select 
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
               <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2">Pricing Preview</p>
               <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-900">₹{(Number(form.expected_price || 0) + 2000).toLocaleString()}</span>
                  <span className="text-xs font-bold text-blue-400">Net Display Price</span>
               </div>
               <p className="text-[10px] text-blue-400 mt-1 font-medium italic">* Includes ₹2,000 fixed platform commission (Cannot be less than base price)</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-black text-gray-900 border-b pb-4">4. Documents & Legal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[
                  { label: "RC Available", name: "rc_available" },
                  { label: "Insurance Available", name: "insurance_available" },
                  { label: "Pollution (PUC)", name: "puc_available" },
                  { label: "Road Tax Paid", name: "road_tax_paid" },
                ].map(doc => (
                  <div key={doc.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <span className="text-sm font-black text-gray-700 uppercase tracking-widest">{doc.label}</span>
                    <input 
                      type="checkbox" 
                      name={doc.name}
                      checked={form[doc.name]}
                      onChange={handleChange}
                      className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 bg-white border-gray-300"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Insurance Valid Till</label>
                  <input 
                    type="date" 
                    name="insurance_valid"
                    value={form.insurance_valid}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Loan Status</label>
                  <select 
                    name="loan_status"
                    value={form.loan_status}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                  >
                    <option value="Clear">Clear (No-Loan)</option>
                    <option value="Active">Active (Hypothecated)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-xl font-black text-gray-900 border-b pb-4">5. Images & Seller Info</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['front', 'back', 'side', 'dashboard', 'rc'].map((type) => (
                <div key={type} className="space-y-2 text-center">
                  <div className="relative group aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 overflow-hidden hover:border-blue-400 hover:bg-blue-50 transition-all">
                    {form.images[type] ? (
                      <>
                        <img src={form.images[type]} className="w-full h-full object-cover" alt={type} />
                        <button 
                          onClick={() => setForm(prev => ({ ...prev, images: { ...prev.images, [type]: "" }}))}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="text-white" />
                        </button>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="text-gray-400 mb-2" />
                        <span className="text-[10px] font-black uppercase text-gray-500">{type} view</span>
                        <input 
                          type="file" 
                          onChange={(e) => handleImageUpload(e, type)}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 space-y-6">
              <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm">Seller Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Name</label>
                  <input 
                    type="text" 
                    name="seller_name"
                    value={form.seller_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Phone</label>
                  <input 
                    type="text" 
                    name="seller_phone"
                    value={form.seller_phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-widest">Description / Extras</label>
                  <textarea 
                    name="description"
                    rows="4"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Tell us about the condition, reason for selling..."
                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-200">
            {form.type === "Car" ? <Car className="text-white w-8 h-8" /> : <Bike className="text-white w-8 h-8" />}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">
              {id ? `Edit ${form.type} Details` : `List Your ${form.type}`}
            </h1>
            <p className="text-gray-500 font-medium">Sell your vehicle faster with detailed specifications</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/admin/bikes")}
            className="px-6 py-3 rounded-2xl font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="px-8 py-4 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Save size={18} />
            {loading ? (id ? "Updating..." : "Listing...") : (id ? `Update ${form.type}` : `Save ${form.type}`)}
          </button>
        </div>
      </div>

      {/* STEPPER */}
      <div className="flex items-center justify-between bg-white px-8 py-4 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto gap-4 scrollbar-hide">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`flex items-center gap-3 whitespace-nowrap px-4 py-2 rounded-2xl transition-all ${
              currentStep === step.id 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
              : currentStep > step.id ? "text-blue-600" : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <step.icon size={18} />
            <span className="text-xs font-black uppercase tracking-wider">{step.name}</span>
            {step.id < steps.length && <ChevronRight size={14} className="ml-2 opacity-50" />}
          </button>
        ))}
      </div>

      {/* FORM BODY */}
      <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-100 relative min-h-[500px] flex flex-col">
        <div className="flex-1">
          {renderStep()}
        </div>

        {/* STEP NAVIGATION */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => prev - 1)}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
              currentStep === 1 ? "opacity-30 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <ChevronLeft size={20} /> Back
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="group flex items-center gap-2 px-10 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all"
            >
              Continue <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Finalize Listing <Plus size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddBike;
