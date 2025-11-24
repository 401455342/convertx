import { Elysia, t } from "elysia";
import sanitize from "sanitize-filename";
import path from "node:path";
import * as tar from "tar";
import { outputDir } from "..";
import db from "../db/db";

// 使用默认用户 ID (不需要认证)
const DEFAULT_USER_ID = 1;

export const apiDownload = new Elysia({ prefix: "/api" })
  .get(
    "/download/:jobId/:fileName",
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

        set.headers["Content-Disposition"] = `attachment; filename="${sanitizedFileName}"`;
        return file;
      } catch (error) {
        console.error("Download API error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to download file",
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
    "/download/:jobId/archive",
    async ({ params, set }) => {
      try {
        const { jobId } = params;

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

        const outputPath = `${outputDir}${DEFAULT_USER_ID}/${jobId}`;
        const outputTar = path.join(outputPath, `converted_files_${jobId}.tar`);

        // Create tar archive
        await tar.create(
          {
            file: outputTar,
            cwd: outputPath,
            filter: (path) => {
              return !path.match(".*\\.tar");
            },
          },
          ["."]
        );

        const tarFile = Bun.file(outputTar);
        if (!(await tarFile.exists())) {
          set.status = 500;
          return {
            success: false,
            error: "Failed to create archive",
          };
        }

        set.headers["Content-Disposition"] = `attachment; filename="converted_files_${jobId}.tar"`;
        return tarFile;
      } catch (error) {
        console.error("Archive download error:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to create archive",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        jobId: t.String(),
      }),
    }
  );
