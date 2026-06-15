import { useState } from "react";
import { Plus } from "lucide-react";

interface Props {
  placeholder: string;
  autoFocus?: boolean;
  onSubmit: (title: string) => void;
  onClose?: () => void;
}

export function AddItemInline({ placeholder, autoFocus, onSubmit, onClose }: Props) {
  const [open, setOpen] = useState(Boolean(autoFocus));
  const [value, setValue] = useState("");

  function close() {
    setValue("");
    setOpen(false);
    onClose?.();
  }

  function submit(keepOpen: boolean) {
    const t = value.trim();
    if (t) onSubmit(t);
    setValue("");
    if (!keepOpen) close();
  }

  if (!open) {
    return (
      <button className="add-trigger" onClick={() => setOpen(true)}>
        <Plus size={14} />
        {placeholder}
      </button>
    );
  }

  return (
    <div className="add-field">
      <input
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit(true); // keep adding successive items
          if (e.key === "Escape") close();
        }}
        onBlur={() => submit(false)}
      />
    </div>
  );
}
