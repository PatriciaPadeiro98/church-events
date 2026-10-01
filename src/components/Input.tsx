type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
};

export const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: InputProps) => {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-bold text-slate-600">{label}</span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition placeholder:text-slate-400 focus:border-pink-600 focus:ring-4 focus:ring-pink-600/10"
      />
    </label>
  );
};