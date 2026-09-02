import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-human/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-canvas hover:bg-ink/90",
        human:
          "bg-human text-human-fg hover:bg-human/90 shadow-[0_0_0_1px_rgb(230_184_77_/_0.3)]",
        agent:
          "bg-agent text-agent-fg hover:bg-agent/90",
        outline:
          "border border-line bg-transparent text-ink hover:bg-panel-2",
        ghost: "text-mute hover:bg-panel-2 hover:text-ink",
        danger:
          "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
        ok: "bg-ok/15 text-ok border border-ok/30 hover:bg-ok/25",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2.5 text-xs",
        lg: "h-11 px-4 text-sm",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
