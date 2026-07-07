// app\components\ui\image-upload.tsx
"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import axios from "axios";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Logo",
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB.");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "universities");
      const { data } = await axios.post("/api/upload", formData);
      if (data.success) {
        onChange(data.url);
        toast.success("Logo uploaded successfully!");
      } else {
        toast.error(data.message || "Upload failed.");
      }
    } catch (error) {
      console.error("[ImageUpload] Upload error:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      {/* Preview area */}
      {value ? (
        <div className="relative group w-full max-w-[160px]">
          <div className="relative h-24 w-24 rounded-xl border-2 border-border overflow-hidden bg-muted shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Logo preview"
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "";
              }}
            />
          </div>
          {/* Overlay actions */}
          <div className="absolute inset-0 w-24 h-24 rounded-xl flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={() => inputRef.current?.click()}
              title="Change image"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={handleRemove}
              title="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        /* Drop Zone */
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors select-none",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            isUploading && "pointer-events-none opacity-70",
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Uploading…</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-7 w-7 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs font-medium">Click or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PNG, JPG, WebP, SVG up to 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* URL input as fallback / manual entry */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Or paste an image URL…"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={isUploading}
      />
    </div>
  );
}
