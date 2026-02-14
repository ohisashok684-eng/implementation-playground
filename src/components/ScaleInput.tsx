interface ScaleInputProps {
  value: number | string | undefined;
  onChange: (num: number) => void;
  activeColor?: string;
  columns?: number;
}

const ScaleInput = ({
  value,
  onChange,
  activeColor = 'bg-primary text-primary-foreground',
  columns = 10,
}: ScaleInputProps) => {
  const nums = Array.from({ length: 10 }, (_, i) => i + 1);
  const colClass = columns === 5 ? 'grid-cols-5' : 'grid-cols-10';

  return (
    <div className={`grid ${colClass} gap-0.5`}>
      {nums.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
          className={`h-8 rounded-lg text-[10px] font-bold transition-all ${
            (typeof value === 'string' ? value === String(num) : value === num)
              ? `${activeColor} shadow-md`
              : 'bg-card text-muted-foreground'
          }`}
        >
          {num}
        </button>
      ))}
    </div>
  );
};

export default ScaleInput;
