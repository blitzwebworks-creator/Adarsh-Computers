"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxImageBytes = 5 * 1024 * 1024;

type ImageFolder = "products" | "categories" | "services" | "business";
type UploadState = "idle" | "uploading" | "uploaded" | "error";

function getObjectPath(publicUrl: string) {
  const marker = "/storage/v1/object/public/business-media/";
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex < 0) return null;
  try { return decodeURIComponent(publicUrl.slice(markerIndex + marker.length)); }
  catch { return null; }
}

export function ImagePicker({ currentImage, folder, allowRemove = true }: { currentImage?: string | null; folder: ImageFolder; allowRemove?: boolean }) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const removeRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const stopWhileImageIsUnready = (event: Event) => {
      const state = form.dataset.imageUploadState;
      if (state === "uploading" || state === "error") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setUploadMessage(state === "uploading" ? "Please wait for the image upload to finish." : "Choose a valid image and wait for it to upload before saving.");
      }
    };
    form.addEventListener("submit", stopWhileImageIsUnready, true);
    return () => form.removeEventListener("submit", stopWhileImageIsUnready, true);
  }, []);

  async function discardTemporaryUpload(publicUrl: string) {
    const objectPath = getObjectPath(publicUrl);
    if (!objectPath) return;
    try { await createClient().storage.from("business-media").remove([objectPath]); }
    catch { /* A temporary object can be cleaned up later if storage is unavailable. */ }
  }

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = inputRef.current?.form;
    if (!acceptedImageTypes.has(file.type) || file.size > maxImageBytes) {
      if (form) form.dataset.imageUploadState = "error";
      setUploadState("error");
      setUploadMessage("Choose a JPG, PNG, WebP or AVIF image under 5 MB.");
      event.target.value = "";
      return;
    }

    if (uploadedImageUrl) void discardTemporaryUpload(uploadedImageUrl);
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    setPreview(objectUrl);
    setUploadedImageUrl("");
    if (removeRef.current) removeRef.current.value = "no";
    if (form) form.dataset.imageUploadState = "uploading";
    setUploadState("uploading");
    setUploadMessage("Uploading image securely…");

    try {
      const safeName = file.name.split(/[\\/]/).pop()?.replace(/[^a-zA-Z0-9._-]/g, "-") || "image";
      const objectPath = `${folder}/${crypto.randomUUID()}-${safeName}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from("business-media").upload(objectPath, file, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const publicUrl = supabase.storage.from("business-media").getPublicUrl(objectPath).data.publicUrl;
      setUploadedImageUrl(publicUrl);
      if (form) form.dataset.imageUploadState = "ready";
      setUploadState("uploaded");
      setUploadMessage("Image uploaded. Save the form to publish it.");
    } catch {
      if (form) form.dataset.imageUploadState = "error";
      setUploadState("error");
      setUploadMessage("Image upload failed. Sign in as an authorized administrator and confirm the business-media Storage setup is applied.");
    }
  }

  function remove() {
    if (uploadedImageUrl) void discardTemporaryUpload(uploadedImageUrl);
    setUploadedImageUrl("");
    setPreview(null);
    setFileUrl(null);
    setUploadState("idle");
    setUploadMessage("");
    if (inputRef.current) inputRef.current.value = "";
    if (removeRef.current) removeRef.current.value = "yes";
    if (inputRef.current?.form) inputRef.current.form.dataset.imageUploadState = "ready";
  }

  return <div className="image-picker" data-upload-state={uploadState}>
    {preview && <div className="image-picker-preview"><Image src={preview} alt="Selected image preview" fill sizes="200px" unoptimized />{allowRemove && <button type="button" className="image-picker-remove" onClick={remove} disabled={uploadState === "uploading"} aria-label="Remove current image"><X size={16} /></button>}</div>}
    <label className={preview ? "image-replace" : "image-picker-empty"} aria-disabled={uploadState === "uploading"}>{uploadState === "uploading" ? <><LoaderCircle size={17} className="image-picker-spinner" /> Uploading image…</> : preview ? "Replace image" : <><ImagePlus size={20} /> Add an image</>}<input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={choose} disabled={uploadState === "uploading"} /></label>
    <input type="hidden" name="uploaded_image_url" value={uploadedImageUrl} />
    <input ref={removeRef} type="hidden" name="remove_image" value="no" />
    <small>JPG, PNG, WebP or AVIF · 5 MB maximum</small>
    {uploadMessage && <small role={uploadState === "error" ? "alert" : "status"} className={`image-picker-message image-picker-message-${uploadState}`}>{uploadMessage}</small>}
  </div>;
}
