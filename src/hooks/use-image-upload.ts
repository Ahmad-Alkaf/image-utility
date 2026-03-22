"use client";

import { useState, useCallback } from "react";

interface UseImageUploadOptions {
  maxFiles?: number;
  onUploadComplete?: (files: File[]) => void;
}

interface UseImageUploadReturn {
  files: File[];
  previews: string[];
  uploading: boolean;
  uploadProgress: number;
  setFiles: (files: File[]) => void;
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  uploadFiles: (
    endpoint: string,
    formDataExtras?: Record<string, string>
  ) => Promise<Response>;
}

export function useImageUpload(
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const { maxFiles = 1, onUploadComplete } = options;
  const [files, setFilesState] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const setFiles = useCallback(
    (newFiles: File[]) => {
      const limited = newFiles.slice(0, maxFiles);
      setFilesState(limited);
      // Generate preview URLs
      previews.forEach((url) => URL.revokeObjectURL(url));
      const newPreviews = limited.map((f) => URL.createObjectURL(f));
      setPreviews(newPreviews);
    },
    [maxFiles, previews]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      setFilesState((prev) => {
        const combined = [...prev, ...newFiles].slice(0, maxFiles);
        const newPreviews = combined.map((f) => URL.createObjectURL(f));
        setPreviews((old) => {
          old.forEach((url) => URL.revokeObjectURL(url));
          return newPreviews;
        });
        return combined;
      });
    },
    [maxFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      setFilesState((prev) => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
      setPreviews((prev) => {
        const next = [...prev];
        URL.revokeObjectURL(next[index]);
        next.splice(index, 1);
        return next;
      });
    },
    []
  );

  const clearFiles = useCallback(() => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFilesState([]);
    setPreviews([]);
    setUploadProgress(0);
  }, [previews]);

  const uploadFiles = useCallback(
    async (
      endpoint: string,
      formDataExtras?: Record<string, string>
    ): Promise<Response> => {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      if (formDataExtras) {
        Object.entries(formDataExtras).forEach(([key, value]) =>
          formData.append(key, value)
        );
      }

      try {
        // Simulate progress since fetch doesn't support upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);
        onUploadComplete?.(files);

        return response;
      } finally {
        setUploading(false);
      }
    },
    [files, onUploadComplete]
  );

  return {
    files,
    previews,
    uploading,
    uploadProgress,
    setFiles,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
  };
}
