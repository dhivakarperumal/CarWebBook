import LoginForm from "./LoginForm";

const LoginModal = ({ open, onClose, onOpenRegister }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      
      {/* MODAL CONTAINER */}
      <div
       className="relative bg-black rounded-2xl max-h-[90vh] w-full max-w-sm overflow-y-auto"
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white z-10 cursor-pointer"
        >
          ✕
        </button>

        {/* LOGIN FORM */}
        <LoginForm
          onSuccess={onClose}
          onOpenRegister={onOpenRegister}
        />
      </div>

    </div>
  );
};

export default LoginModal;