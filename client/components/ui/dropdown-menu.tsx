"use client";

import { Menu } from "@base-ui/react/menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

type DropdownMenuContentProps = ComponentProps<typeof Menu.Popup> &
  Pick<ComponentProps<typeof Menu.Positioner>, "align" | "side" | "sideOffset">;

export function DropdownMenuContent({
  className = "",
  sideOffset = 6,
  side = "bottom",
  align = "end",
  ...props
}: DropdownMenuContentProps) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={sideOffset} side={side} align={align}>
        <Menu.Popup
          className={cn(
            "z-50 min-w-48 overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-900 shadow-lg outline-none",
            className,
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
}

type DropdownMenuItemProps = ComponentProps<typeof Menu.Item>;

export function DropdownMenuItem({
  className = "",
  ...props
}: DropdownMenuItemProps) {
  return (
    <Menu.Item
      className={cn(
        "flex cursor-default select-none items-center rounded px-2.5 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-zinc-100 data-[highlighted]:text-zinc-950",
        className,
      )}
      {...props}
    />
  );
}

type DropdownMenuLinkProps = ComponentProps<typeof Menu.LinkItem>;

export function DropdownMenuLink({
  className = "",
  ...props
}: DropdownMenuLinkProps) {
  return (
    <Menu.LinkItem
      className={cn(
        "flex items-center rounded px-2.5 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-zinc-100 data-[highlighted]:text-zinc-950",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className = "" }: { className?: string }) {
  return <Menu.Separator className={cn("my-1 h-px bg-zinc-200", className)} />;
}
