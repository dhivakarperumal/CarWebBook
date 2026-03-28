import RegisterForm from "./RegisterForm";

const RegisterModal = ({ open, onClose, onSwitchToLogin }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      
      {/* MODAL CONTAINER */}
      <div
  className="relative bg-black rounded-2xl
             max-h-[90vh] w-full max-w-sm overflow-y-auto"
>
        {/* CLOSE BUTTON */}
        <button
  onClick={onClose}
  className="absolute top-3 right-3 text-slate-400 hover:text-white z-50 cursor-pointer"
>
          ✕
        </button>

        {/* REGISTER FORM */}
        <RegisterForm
          onSuccess={onClose}
          onSwitchToLogin={onSwitchToLogin}
        />
      </div>

    </div>
  );
};

export default RegisterModal;