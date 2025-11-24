import { mkdir } from "node:fs/promises";
import { Elysia, t } from "elysia";
import db from "../db/db";
import { uploadsDir } from "../index";

// 使用默认用户 ID (不需要认证)
const DEFAULT_USER_ID = 1;

export const apiUpload = new Elysia({ prefix: "/api" })
  .post(
    "/upload",
    async ({ body, set }) => {
      try {
        // Create a new job (let database auto-generate ID)
        const now = new Date().toISOString();

        const insertResult = db.query(
          "INSERT INTO jobs (user_id, date_created, status, num_files) VALUES (?1, ?2, ?3, ?4)"
        ).run(DEFAULT_USER_ID, now, "uploading", 0);

        // Get the auto-generated job ID
        const jobId = insertResult.lastInsertRowid;

        // Create upload directory
        const userUploadsDir = `${uploadsDir}${DEFAULT_USER_ID}/${jobId}/`;
        await mkdir(userUploadsDir, { recursive: true });

        // Handle file upload
        const files = body.file;
        const uploadedFiles: string[] = [];

        if (files) {
          if (Array.isArray(files)) {
            for (const file of files) {
              await Bun.write(`${userUploadsDir}${file.name}`, file);
              uploadedFiles.push(file.name);
            }
          } else {
            await Bun.write(`${userUploadsDir}${files.name}`, files);
            uploadedFiles.push(files.name);
          }
        }

        // Update job with number of files
        db.query("UPDATE jobs SET num_files = ?1 WHERE id = ?2").run(
          uploadedFiles.length,
          jobId
        );

        set.status = 200;
        return {
          success: true,
          jobId: jobId,
          userId: DEFAULT_USER_ID,
          filesUploaded: uploadedFiles.length,
          files: uploadedFiles,
          message: "Files uploaded successfully",
        };
      } catch (error) {
        console.error("Upload error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to upload files",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        file: t.Union([t.File(), t.Files()]),
      }),
    }
  );
