"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { invoiceListHref } from "@/lib/book-search";

export function SearchField({
  defaultValue,
  status,
  placeholder,
}: {
  defaultValue?: string;
  status?: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const next = defaultValue ?? "";
    setValue((current) => (current === next ? current : next));
  }, [defaultValue]);

  function go(next: string) {
    const href = invoiceListHref({ q: next, status });
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <form
      className="flex w-full gap-2 sm:max-w-xs"
      onSubmit={(event) => {
        event.preventDefault();
        go(value);
      }}
    >
      {status && status !== "ALL" ? <input type="hidden" name="status" value={status} /> : null}
      <Input
        name="q"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => go(next), 220);
        }}
      />
    </form>
  );
}
