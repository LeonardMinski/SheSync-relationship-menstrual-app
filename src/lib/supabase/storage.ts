import { supabase } from "@/lib/supabase/client";
import type {
  FileDelete,
  FileDownload,
  FileUpload,
  StorageFile,
} from "@/types";

export const storage = {
  async upload(
    data: FileUpload,
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const bucket = data.bucket || "default";
      const { error } = await supabase.storage
        .from(bucket)
        .upload(data.path, data.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        return { url: null, error: error.message };
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      return {
        url: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async download(
    data: FileDownload,
  ): Promise<{ blob: Blob | null; error: string | null }> {
    try {
      const bucket = data.bucket || "default";
      const { data: blob, error } = await supabase.storage
        .from(bucket)
        .download(data.path);

      if (error) {
        return { blob: null, error: error.message };
      }

      return { blob, error: null };
    } catch (error) {
      return {
        blob: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async delete(data: FileDelete): Promise<{ error: string | null }> {
    try {
      const bucket = data.bucket || "default";
      const { error } = await supabase.storage.from(bucket).remove([data.path]);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async list(
    bucket: string = "default",
    path: string = "",
  ): Promise<{ files: StorageFile[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(path);

      if (error) {
        return { files: null, error: error.message };
      }

      const files: StorageFile[] = data.map((item) => ({
        name: item.name,
        id: item.id,
        updated_at: item.updated_at,
        created_at: item.created_at,
        last_accessed_at: item.last_accessed_at,
        metadata: item.metadata || {},
      }));

      return { files, error: null };
    } catch (error) {
      return {
        files: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getPublicUrl(
    path: string,
    bucket: string = "default",
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { url: data.publicUrl, error: null };
    } catch (error) {
      return {
        url: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async createSignedUrl(
    path: string,
    expiresIn: number = 3600,
    bucket: string = "default",
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return { url: null, error: error.message };
      }

      return { url: data.signedUrl, error: null };
    } catch (error) {
      return {
        url: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async move(
    fromPath: string,
    toPath: string,
    bucket: string = "default",
  ): Promise<{ error: string | null }> {
    try {
      const { blob, error: downloadError } = await this.download({
        path: fromPath,
        bucket,
      });
      if (downloadError) {
        return { error: downloadError };
      }

      if (!blob) {
        return { error: "Failed to download file for moving" };
      }

      const file = new File([blob], toPath.split("/").pop() || "file", {
        type: blob.type,
      });
      const { error: uploadError } = await this.upload({
        file,
        path: toPath,
        bucket,
      });
      if (uploadError) {
        return { error: uploadError };
      }

      const { error: deleteError } = await this.delete({
        path: fromPath,
        bucket,
      });
      if (deleteError) {
        return { error: deleteError };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async copy(
    fromPath: string,
    toPath: string,
    bucket: string = "default",
  ): Promise<{ error: string | null }> {
    try {
      const { blob, error: downloadError } = await this.download({
        path: fromPath,
        bucket,
      });
      if (downloadError) {
        return { error: downloadError };
      }

      if (!blob) {
        return { error: "Failed to download file for copying" };
      }

      const file = new File([blob], toPath.split("/").pop() || "file", {
        type: blob.type,
      });
      const { error: uploadError } = await this.upload({
        file,
        path: toPath,
        bucket,
      });
      if (uploadError) {
        return { error: uploadError };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const imageStorage = {
  async uploadImage(
    data: FileUpload,
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      if (!data.file.type.startsWith("image/")) {
        return { url: null, error: "File must be an image" };
      }
      return await storage.upload(data);
    } catch (error) {
      return {
        url: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getImageUrl(
    path: string,
    width?: number,
    height?: number,
    bucket: string = "default",
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const { url, error } = await storage.getPublicUrl(path, bucket);
      if (error) {
        return { url: null, error };
      }

      if (width || height) {
        const params = new URLSearchParams();
        if (width) params.append("width", width.toString());
        if (height) params.append("height", height.toString());
        return { url: `${url}?${params.toString()}`, error: null };
      }

      return { url, error: null };
    } catch (error) {
      return {
        url: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const documentStorage = {
  async uploadDocument(
    data: FileUpload,
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (!allowedTypes.includes(data.file.type)) {
        return { url: null, error: "File type not supported" };
      }

      return await storage.upload(data);
    } catch (error) {
      return {
        url: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const audioStorage = {
  async uploadAudio(
    data: FileUpload,
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      if (!data.file.type.startsWith("audio/")) {
        return { url: null, error: "File must be an audio file" };
      }

      return await storage.upload(data);
    } catch (error) {
      return {
        url: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

export const uploadProfileImage = async (
  file: File,
  userId: string,
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/profile.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading profile image:", error);
      return { url: null, error: error.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error("Profile image upload failed:", error);
    return {
      url: null,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
};

export const deleteProfileImage = async (
  userId: string,
): Promise<{ error: string | null }> => {
  try {
    const possibleFiles = [
      `profiles/${userId}/profile.jpg`,
      `profiles/${userId}/profile.png`,
      `profiles/${userId}/profile.jpeg`,
      `profiles/${userId}/profile.webp`,
    ];

    const { error } = await supabase.storage
      .from("avatars")
      .remove(possibleFiles);

    if (error) {
      console.error("Error deleting profile image:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("Profile image deletion failed:", error);
    return {
      error: error instanceof Error ? error.message : "Deletion failed",
    };
  }
};

export default storage;
