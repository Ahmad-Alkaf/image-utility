"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface UseImageUploadOptions {
  maxFiles?: number;
}

interface UseImageUploadReturn {
  files: File[];
  /** Object URLs for the selected files, same order as `files`. */
  previews: string[];
  setFiles: (files: File[]) => void;
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
}

/**
 * Keeps the selected files and their preview URLs in sync, and revokes
 * object URLs that are no longer needed.
 */
export function useImageUpload(
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const { maxFiles = 1 } = options;
  const [files, setFilesState] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const previewsRef = useRef<string[]>([]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Revoke every preview when the component using the hook unmounts.
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const setFiles = useCallback(
    (newFiles: File[]) => {
      const limited = newFiles.slice(0, maxFiles);
      setFilesState(limited);
      setPreviews((old) => {
        old.forEach((url) => URL.revokeObjectURL(url));
        return limited.map((f) => URL.createObjectURL(f));
      });
    },
    [maxFiles]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const newFileUrls = newFiles.map((f) => URL.createObjectURL(f));
      setFilesState((prev) => [...prev, ...newFiles].slice(0, maxFiles));
      setPreviews((oldPreviews) => {
        const all = [...oldPreviews, ...newFileUrls];
        all.slice(maxFiles).forEach((url) => URL.revokeObjectURL(url));
        return all.slice(0, maxFiles);
      });
    },
    [maxFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFilesState((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      if (index >= 0 && index < prev.length) URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setPreviews((old) => {
      old.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setFilesState([]);
  }, []);

  return { files, previews, setFiles, addFiles, removeFile, clearFiles };
}
