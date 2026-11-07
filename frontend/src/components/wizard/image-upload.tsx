"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUploadImage } from "@/lib/hooks/use-account";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { cn } from "@/lib/utils";

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Uploads to Cloudinary through the API (validated & re-encoded server-side). */
export function ImageUpload({ value, onChange, purpose, label, shape = "circle" }: {
  value: string;
  onChange: (url: string) => void;
  purpose: "avatar" | "profile" | "logo";
  label: string;
  shape?: "circle" | "square";
}) {
  const t = useTranslations("common");
  const tv = useTranslations("validation");
  const tw = useTranslations("wizard.personal");
  const errorMessage = useErrorMessage();
  const upload = useUploadImage();
  const input = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return toast.error(tv("fileType"));
    if (file.size > MAX) return toast.error(tv("fileTooLarge"));
    upload.mutate({ file, purpose }, { onSuccess: ({ url }) => onChange(url), onError: (e) => toast.error(errorMessage(e)) });
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cn(
          "relative flex size-20 shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition hover:border-primary hover:text-primary",
          shape === "circle" ? "rounded-full" : "rounded-2xl",
        )}
        aria-label={label}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={cn("size-full", purpose === "logo" ? "object-contain p-2" : "object-cover")} />
        ) : (
          <ImagePlus className="size-6" />
        )}
        {upload.isPending && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="size-5 animate-spin text-primary" />
          </span>
        )}
      </button>
      <div className="grid gap-1.5">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()} loading={upload.isPending}>
            {upload.isPending ? t("uploading") : value ? t("replace") : t("upload")}
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")} aria-label={t("remove")}>
              <Trash2 />
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{tw("uploadHint")}</span>
      </div>
      <input
        ref={input}
        type="file"
        accept={TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
