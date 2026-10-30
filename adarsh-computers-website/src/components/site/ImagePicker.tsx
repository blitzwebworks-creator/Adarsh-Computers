"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";

export function ImagePicker({ currentImage, allowRemove = true }: { currentImage?: string | null; allowRemove?: boolean }) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const removeRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  function choose(event: ChangeEvent<HTMLInputElement>) {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const file = event.target.files?.[0];
    if (!file) { setFileUrl(null); setPreview(currentImage || null); return; }
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    setPreview(objectUrl);
    if (removeRef.current) removeRef.current.value = "no";
  }

  function remove() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    if (removeRef.current) removeRef.current.value = "yes";
  }

  return <div className="image-picker">
    {preview && <div className="image-picker-preview"><Image src={preview} alt="Selected image preview" fill sizes="200px" unoptimized />{allowRemove && <button type="button" className="image-picker-remove" onClick={remove} aria-label="Remove current image"><X size={16} /></button>}</div>}
    <label className={preview ? "image-replace" : "image-picker-empty"}>{preview ? "Replace image" : <><ImagePlus size={20} /> Add an image</>}<input ref={inputRef} type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" onChange={choose} /></label>
    <input ref={removeRef} type="hidden" name="remove_image" value="no" />
    <small>JPG, PNG, WebP or AVIF · 5 MB maximum</small>
  </div>;
}
