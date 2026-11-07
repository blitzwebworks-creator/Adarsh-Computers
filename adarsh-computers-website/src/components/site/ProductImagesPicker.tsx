"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxImageBytes = 5 * 1024 * 1024;
const maxGalleryImages = 4;

function getObjectPath(publicUrl: string) {
  const marker = "/storage/v1/object/public/business-media/";
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex < 0) return null;
  try { return decodeURIComponent(publicUrl.slice(markerIndex + marker.length)); }
  catch { return null; }
}

export function ProductImagesPicker({ mainImage, galleryImages: initialGalleryImages }: { mainImage?: string | null; galleryImages: string[] }) {
  const [mainImagePreview, setMainImagePreview] = useState(mainImage || "");
  const [uploadedMainImage, setUploadedMainImage] = useState("");
  const [removeMainImage, setRemoveMainImage] = useState(false);
  const [galleryImages, setGalleryImages] = useState(initialGalleryImages || []);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedGalleryImages, setUploadedGalleryImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const uploadedImagesRef = useRef<string[]>([]);
  const submittedRef = useRef(false);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const remaining = Math.max(0, maxGalleryImages - galleryImages.length);

  useEffect(() => {
    mountedRef.current = true;
    const form = mainInputRef.current?.form;
    const guardSubmit = (event: Event) => {
      if (busyRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setMessage("Please wait for the image upload to finish before saving the product.");
        return;
      }
      submittedRef.current = true;
    };
    form?.addEventListener("submit", guardSubmit, true);
    return () => {
      mountedRef.current = false;
      form?.removeEventListener("submit", guardSubmit, true);
      if (!submittedRef.current && uploadedImagesRef.current.length) {
        const paths = uploadedImagesRef.current.map(getObjectPath).filter((path): path is string => Boolean(path));
        void createClient().storage.from("business-media").remove(paths).catch(() => undefined);
      }
    };
  }, []);

  function validate(files: File[]) {
    if (files.some((file) => !acceptedImageTypes.has(file.type) || file.size > maxImageBytes)) {
      setMessage("Use JPG, PNG, WebP or AVIF images up to 5 MB each.");
      return false;
    }
    setMessage("");
    return true;
  }

  async function uploadFiles(files: File[]) {
    busyRef.current = true;
    setUploading(true);
    setMessage("");
    const form = mainInputRef.current?.form;
    if (form) form.dataset.imageUploadState = "uploading";
    let supabase: ReturnType<typeof createClient> | null = null;
    const uploaded: { path: string; url: string }[] = [];
    try {
      supabase = createClient();
      for (const file of files) {
        const safeName = file.name.split(/[\\/]/).pop()?.replace(/[^a-zA-Z0-9._-]/g, "-") || "image";
        const path = `products/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from("business-media").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
        if (error) throw error;
        uploaded.push({ path, url: supabase.storage.from("business-media").getPublicUrl(path).data.publicUrl });
        if (!mountedRef.current && !submittedRef.current) {
          await supabase.storage.from("business-media").remove(uploaded.map((image) => image.path));
          return null;
        }
      }
      uploadedImagesRef.current = [...uploadedImagesRef.current, ...uploaded.map((image) => image.url)];
      setUploadedImages((current) => [...current, ...uploaded.map((image) => image.url)]);
      return uploaded.map((image) => image.url);
    } catch {
      if (uploaded.length && supabase) await supabase.storage.from("business-media").remove(uploaded.map((image) => image.path));
      setMessage("Image upload failed. Sign in as an authorized administrator and confirm the business-media Storage setup is applied.");
      return null;
    } finally {
      if (form) form.dataset.imageUploadState = "ready";
      busyRef.current = false;
      setUploading(false);
    }
  }

  async function chooseMain(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || busyRef.current || !validate([file])) return;
    const urls = await uploadFiles([file]);
    if (!urls?.[0]) return;
    setMainImagePreview(urls[0]);
    setUploadedMainImage(urls[0]);
    setRemoveMainImage(false);
  }

  async function chooseGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = "";
    if (!files.length || busyRef.current) return;
    if (files.length > remaining) {
      setMessage(`You can add ${remaining} more detail image${remaining === 1 ? "" : "s"}.`);
      return;
    }
    if (!validate(files)) return;
    const urls = await uploadFiles(files);
    if (urls) {
      setGalleryImages((current) => [...current, ...urls]);
      setUploadedGalleryImages((current) => [...current, ...urls]);
    }
  }

  function clearMain() {
    setMainImagePreview("");
    setUploadedMainImage("");
    setRemoveMainImage(true);
    setMessage("");
  }

  return <div className="product-images-picker">
    <input type="hidden" name="uploaded_image_url" value={uploadedMainImage} />
    <input type="hidden" name="remove_image" value={removeMainImage ? "yes" : "no"} />
    <input type="hidden" name="image_urls" value={galleryImages.join("\n")} />
    <input type="hidden" name="uploaded_product_image_urls" value={uploadedImages.join("\n")} />
    <input type="hidden" name="uploaded_gallery_image_urls" value={uploadedGalleryImages.join("\n")} />

    <div className="product-image-group">
      <div className="product-image-group-heading"><strong>Main product image</strong><span>Shown on listings and first in the gallery</span></div>
      {mainImagePreview ? <div className="product-image-main-preview"><Image src={mainImagePreview} alt="Main product image preview" width={160} height={120} unoptimized /><button type="button" onClick={clearMain} aria-label="Remove main product image" disabled={uploading}><X size={15} /></button></div> : <div className="product-image-main-empty"><ImagePlus size={20} /><span>No main image selected</span></div>}
      <label className={`product-image-upload${uploading ? " is-disabled" : ""}`}>
        {uploading ? <LoaderCircle size={15} className="product-image-spinner" /> : <ImagePlus size={15} />}
        {uploading ? "Uploading image…" : mainImagePreview ? "Replace main image" : "Upload main image"}
        <input ref={mainInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={chooseMain} disabled={uploading} />
      </label>
    </div>

    <div className="product-image-group">
      <div className="product-image-group-heading"><strong>Detail images</strong><span>{galleryImages.length} of {maxGalleryImages}{galleryImages.length > maxGalleryImages ? " legacy images" : ""}</span></div>
      {galleryImages.length > 0 && <div className="product-detail-image-grid">{galleryImages.map((image, index) => <div className="product-detail-image-tile" key={`${image}-${index}`}><Image src={image} alt={`Product detail view ${index + 1}`} width={96} height={76} unoptimized /><span>View {index + 1}</span><button type="button" onClick={() => { setGalleryImages((current) => current.filter((_, itemIndex) => itemIndex !== index)); setUploadedGalleryImages((current) => current.filter((url) => url !== image)); }} aria-label={`Remove detail image ${index + 1}`} disabled={uploading}><X size={14} /></button></div>)}</div>}
      <label className={`product-image-upload${uploading || remaining === 0 ? " is-disabled" : ""}`}>
        {uploading ? <LoaderCircle size={15} className="product-image-spinner" /> : <ImagePlus size={15} />}
        {uploading ? "Uploading images…" : remaining ? `Add detail images (${remaining} remaining)` : "Maximum detail images reached"}
        <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={chooseGallery} disabled={uploading || remaining === 0} />
      </label>
      <small>Upload up to 4 additional JPG, PNG, WebP or AVIF images, 5 MB each. Existing products with more images can keep them; remove enough to add new ones.</small>
    </div>

    {message && <p className="product-image-message" role="status">{message}</p>}
    {uploading && <p className="product-image-upload-status" role="status"><LoaderCircle size={14} className="product-image-spinner" /> Uploading securely to product storage…</p>}
  </div>;
}
