import { Elysia, t } from "elysia";
import sanitize from "sanitize-filename";
import { outputDir } from "..";
import db from "../db/db";

// 使用默认用户 ID (不需要认证)
const DEFAULT_USER_ID = 1;

// Supported preview MIME types
const PREVIEW_MIME_TYPES: Record<string, string> = {
  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  
  // Text
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".xml": "text/xml",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".csv": "text/csv",
  
  // PDF
  ".pdf": "application/pdf",
};

function getMimeType(fileName: string): string | null {
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  return PREVIEW_MIME_TYPES[ext] || null;
}

function isPreviewSupported(fileName: string): boolean {
  return getMimeType(fileName) !== null;
}

export const apiPreview = new Elysia({ prefix: "/api" })
  .get(
    "/preview/:jobId/:fileName",
    async ({ params, set }) => {
      try {
        const { jobId, fileName } = params;

        // Verify job belongs to user
        const job = await db
          .query("SELECT * FROM jobs WHERE user_id = ? AND id = ?")
          .get(DEFAULT_USER_ID, jobId);

        if (!job) {
          set.status = 404;
          return {
            success: false,
            error: "Job not found",
          };
        }

        // Sanitize and decode filename
        const sanitizedFileName = sanitize(decodeURIComponent(fileName));
        
        // Check if preview is supported
        if (!isPreviewSupported(sanitizedFileName)) {
          set.status = 400;
          return {
            success: false,
            error: "Preview not supported for this file type",
            supportedTypes: Object.keys(PREVIEW_MIME_TYPES),
          };
        }

        const filePath = `${outputDir}${DEFAULT_USER_ID}/${jobId}/${sanitizedFileName}`;

        // Check if file exists
        const file = Bun.file(filePath);
        if (!(await file.exists())) {
          set.status = 404;
          return {
            success: false,
            error: "File not found",
          };
        }

        // Set appropriate content type
        const mimeType = getMimeType(sanitizedFileName);
        if (mimeType) {
          set.headers["Content-Type"] = mimeType;
        }

        // For images and PDFs, return file directly
        const ext = sanitizedFileName.substring(sanitizedFileName.lastIndexOf(".")).toLowerCase();
        if (
          [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico", ".pdf"].includes(ext)
        ) {
          return file;
        }

        // For text files, return as JSON with content
        const content = await file.text();
        set.headers["Content-Type"] = "application/json";
        return {
          success: true,
          fileName: sanitizedFileName,
          mimeType: mimeType,
          content: content,
          size: file.size,
        };
      } catch (error) {
        console.error("Preview API error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to preview file",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        jobId: t.String(),
        fileName: t.String(),
      }),
    }
  )
  .get(
    "/preview/:jobId/:fileName/info",
    async ({ params, set }) => {
      try {
        const { jobId, fileName } = params;

        // Verify job belongs to user
        const job = await db
          .query("SELECT * FROM jobs WHERE user_id = ? AND id = ?")
          .get(DEFAULT_USER_ID, jobId);

        if (!job) {
          set.status = 404;
          return {
            success: false,
            error: "Job not found",
          };
        }

        const sanitizedFileName = sanitize(decodeURIComponent(fileName));
        const filePath = `${outputDir}${DEFAULT_USER_ID}/${jobId}/${sanitizedFileName}`;

        const file = Bun.file(filePath);
        if (!(await file.exists())) {
          set.status = 404;
          return {
            success: false,
            error: "File not found",
          };
        }

        const mimeType = getMimeType(sanitizedFileName);
        
        return {
          success: true,
          fileName: sanitizedFileName,
          mimeType: mimeType,
          size: file.size,
          previewSupported: isPreviewSupported(sanitizedFileName),
          lastModified: new Date((await file.lastModified) || Date.now()).toISOString(),
        };
      } catch (error) {
        console.error("Preview info error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to get file info",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        jobId: t.String(),
        fileName: t.String(),
      }),
    }
  );
