import { Input } from "@/components/ui/input"

export function FloatingLabelInput({ id, label, ...props }) {
  return (
    <div className="relative w-full">
      <Input
        id={id}
        placeholder=" "
        className="peer h-12 rounded-full bg-transparent px-3 pt-4 pb-2"
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-2 z-10 origin-[0] 
                   -translate-y-1/2 scale-100 transform text-base text-muted-foreground 
                   transition-all duration-200
                   peer-placeholder-shown:top-1/2 
                   peer-placeholder-shown:scale-100 
                   peer-placeholder-shown:-translate-y-1/2 
                   peer-focus:top-1 
                   peer-focus:scale-90 
                   peer-focus:text-[var(--primary)] 
                   peer-focus:-translate-y-1"
        >
        {label}
      </label>
    </div>
  )
}
